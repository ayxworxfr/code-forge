import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DataSourceService } from '../datasource/datasource.service';
import { TemplateService } from '../template/template.service';
import { TypeMappingService } from '../type-mapping/type-mapping.service';
import { HistoryService } from '../history/history.service';
import * as nunjucks from 'nunjucks';
import archiver from 'archiver';
import { Readable } from 'stream';

interface GenerateContext {
  global: {
    author: string;
    date: string;
    packageName: string;
    packagePath: string;
    moduleName: string;
  };
  table: {
    tableName: string;
    tableComment: string;
    shortClassName: string;
    shortCamelName: string;
    pkColumn?: any;
    columns: any[];
    normalColumns: any[];
    javaImports: string[];
  };
}

@Injectable()
export class GeneratorService {
  private env: nunjucks.Environment;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly dataSourceService: DataSourceService,
    private readonly templateService: TemplateService,
    private readonly typeMappingService: TypeMappingService,
    private readonly historyService: HistoryService,
  ) {
    this.env = nunjucks.configure({ autoescape: false });
    this.registerFilters();
  }

  private registerFilters() {
    this.env.addFilter('camelCase', (str: string) => {
      const source = String(str ?? '');
      return source.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    });

    this.env.addFilter('pascalCase', (str: string) => {
      const source = String(str ?? '');
      const camel = source.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    });

    this.env.addFilter('snakeCase', (str: string) => {
      const source = String(str ?? '');
      return source
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
    });

    this.env.addFilter('kebabCase', (str: string) => {
      const source = String(str ?? '');
      return source
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
    });

    this.env.addFilter('constantCase', (str: string) => {
      const source = String(str ?? '');
      return source
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');
    });

    this.env.addFilter('removePrefix', (str: string, prefix: string) => {
      const source = String(str ?? '');
      const sourcePrefix = String(prefix ?? '');
      return source.startsWith(sourcePrefix) ? source.slice(sourcePrefix.length) : source;
    });
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  private buildContext(tableDetail: any, globalConfig: any): any {
    const packageName = globalConfig.packageName || 'com.example.demo';
    const packagePath = packageName.replace(/\./g, '/');
    const moduleName = globalConfig.moduleName || 'system';
    const tablePrefix = globalConfig.tablePrefix || '';
    const author = globalConfig.author || 'admin';
    const date = globalConfig.date || new Date().toISOString().split('T')[0];
    const idType = globalConfig.idType || 'AUTO';

    const shortTableName = tableDetail.tableName.startsWith(tablePrefix)
      ? tableDetail.tableName.slice(tablePrefix.length)
      : tableDetail.tableName;

    const shortClassName = this.toPascalCase(shortTableName);
    const shortCamelName = this.toCamelCase(shortTableName);

    const columns = tableDetail.columns.map((col: any) => {
      const javaField = this.toCamelCase(col.columnName);
      const tsField = javaField;

      const baseType = col.dataType.toLowerCase();
      const fullType = col.columnType.toLowerCase();

      let typeMapping = this.typeMappingService.findBySourceType(fullType);
      if (!typeMapping) {
        typeMapping = this.typeMappingService.findBySourceType(baseType);
      }

      return {
        columnName: col.columnName,
        dataType: col.dataType,
        columnType: col.columnType,
        columnComment: col.columnComment || '',
        isPrimaryKey: col.isPrimaryKey || false,
        isNullable: col.isNullable || false,
        isAutoIncrement: col.extra?.toLowerCase().includes('auto_increment') || false,
        columnLength: col.characterMaxLength || col.columnLength,
        defaultValue: col.columnDefault,
        javaField,
        tsField,
        javaType: typeMapping?.java_type || 'String',
        tsType: typeMapping?.ts_type || 'string',
        jdbcType: typeMapping?.jdbc_type || 'VARCHAR',
      };
    });

    // 如果源表没有显式主键，使用第一列兜底，避免模板渲染阶段空引用报错
    const pkColumn = columns.find((col: any) => col.isPrimaryKey) || columns[0];
    const normalColumns = columns.filter((col: any) => !col.isPrimaryKey);

    const javaImports = Array.from(
      new Set(
        columns
          .map((col: any) => {
            if (col.javaType === 'LocalDateTime') return 'java.time.LocalDateTime';
            if (col.javaType === 'LocalDate') return 'java.time.LocalDate';
            if (col.javaType === 'LocalTime') return 'java.time.LocalTime';
            if (col.javaType === 'BigDecimal') return 'java.math.BigDecimal';
            return null;
          })
          .filter((imp: any) => imp !== null),
      ),
    );

    return {
      config: {
        author,
        date,
        packageName,
        moduleName,
        idType,
      },
      global: {
        author,
        date,
        packageName,
        packagePath,
        moduleName,
      },
      table: {
        tableName: tableDetail.tableName,
        tableComment: tableDetail.tableComment || '',
        shortClassName,
        shortCamelName,
        entityName: shortClassName,
        pkColumn,
        primaryKey: pkColumn,
        columns,
        normalColumns,
        javaImports: javaImports as string[],
      },
    };
  }

  async preview(params: {
    dataSourceId?: number;
    ddl?: string;
    tableName: string;
    templateFileId: number;
    globalConfig: any;
  }): Promise<{ code: string; filePath: string }> {
    let tableDetail;
    if (params.dataSourceId) {
      tableDetail = await this.dataSourceService.getTableDetail(
        params.dataSourceId,
        params.tableName,
      );
    } else if (params.ddl) {
      const parsedTables = this.dataSourceService.parseDdlTables(params.ddl);
      tableDetail = parsedTables.find((table) => table.tableName === params.tableName);
      if (!tableDetail) {
        throw new BadRequestException(`Table "${params.tableName}" not found in DDL`);
      }
    } else {
      throw new Error('Either dataSourceId or ddl must be provided');
    }

    const templateFile = this.templateService.findOneFile(params.templateFileId);
    const context = this.buildContext(tableDetail, params.globalConfig);

    const code = this.env.renderString(templateFile.content, context);
    const filePath = this.env.renderString(templateFile.output_path, context);

    return { code, filePath };
  }

  async generate(params: {
    dataSourceId?: number;
    ddl?: string;
    tableNames: string[];
    templateGroupId: number;
    templateFileIds?: number[];
    globalConfig: any;
  }): Promise<Readable> {
    const templateGroup = this.templateService.findGroupWithFiles(params.templateGroupId);
    const files = params.templateFileIds
      ? templateGroup.files.filter((f) => params.templateFileIds.includes(f.id))
      : templateGroup.files.filter((f) => f.enabled === 1);

    const archive = archiver('zip', { zlib: { level: 9 } });
    let fileCount = 0;
    const ddlTableMap = params.ddl
      ? new Map(
          this.dataSourceService
            .parseDdlTables(params.ddl)
            .map((table) => [table.tableName, table] as const),
        )
      : null;

    for (const tableName of params.tableNames) {
      let tableDetail;
      if (params.dataSourceId) {
        tableDetail = await this.dataSourceService.getTableDetail(params.dataSourceId, tableName);
      } else if (params.ddl) {
        tableDetail = ddlTableMap?.get(tableName);
        if (!tableDetail) {
          throw new BadRequestException(`Table "${tableName}" not found in DDL`);
        }
      }

      const context = this.buildContext(tableDetail, params.globalConfig);

      for (const templateFile of files) {
        const code = this.env.renderString(templateFile.content, context);
        const filePath = this.env.renderString(templateFile.output_path, context);
        archive.append(code, { name: filePath });
        fileCount++;
      }
    }

    this.historyService.create({
      datasource_id: params.dataSourceId,
      table_names: params.tableNames,
      template_group_id: params.templateGroupId,
      template_group_name: templateGroup.name,
      config_snapshot: params.globalConfig,
      file_count: fileCount,
    });

    archive.finalize();
    return archive;
  }
}

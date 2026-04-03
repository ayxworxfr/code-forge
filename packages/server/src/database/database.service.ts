import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import initSqlJs, { Database } from 'sql.js';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  public db: Database;
  private dbPath: string;

  async onModuleInit() {
    this.dbPath = process.env.DB_PATH || join(__dirname, '../../../data/codeforge.db');
    const dbDir = join(this.dbPath, '..');

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.logger.log(`SQLite database initialized at: ${this.dbPath}`);

    this.initializeTables();
    this.initializeSeedData();
    this.saveDatabase();
    this.logger.log('Database tables initialized');
  }

  private saveDatabase() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
  }

  private initializeTables() {
    this.db.exec(`
      -- 数据源配置表
      CREATE TABLE IF NOT EXISTS data_source (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        host TEXT NOT NULL,
        port INTEGER NOT NULL DEFAULT 3306,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        database_name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 模板组表
      CREATE TABLE IF NOT EXISTS template_group (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_builtin INTEGER DEFAULT 0,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 模板文件表
      CREATE TABLE IF NOT EXISTS template_file (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        output_path TEXT NOT NULL,
        content TEXT NOT NULL,
        language TEXT,
        enabled INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES template_group(id) ON DELETE CASCADE
      );

      -- 类型映射表
      CREATE TABLE IF NOT EXISTS type_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL UNIQUE,
        java_type TEXT NOT NULL,
        ts_type TEXT NOT NULL,
        jdbc_type TEXT NOT NULL,
        is_builtin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 全局配置表
      CREATE TABLE IF NOT EXISTS global_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT NOT NULL UNIQUE,
        config_value TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 生成历史表
      CREATE TABLE IF NOT EXISTS gen_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datasource_id INTEGER,
        datasource_name TEXT,
        table_names TEXT NOT NULL,
        template_group_id INTEGER,
        template_group_name TEXT,
        config_snapshot TEXT,
        file_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_template_file_group_id ON template_file(group_id);
      CREATE INDEX IF NOT EXISTS idx_gen_history_created_at ON gen_history(created_at DESC);
    `);
  }

  private initializeSeedData() {
    const count = this.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM template_group WHERE is_builtin = 1',
    );

    if (count && count.count > 0) {
      this.logger.log('Built-in templates already exist, skipping seed data');
      return;
    }

    this.logger.log('Initializing seed data...');

    try {
      this.transaction(() => {
        this.insertSpringMyBatisPlusTemplates();
        this.insertTypeScriptFrontendTemplates();
        this.insertSpringJpaTemplates();
        this.insertGoGinGormTemplates();
      });
      this.logger.log('Seed data initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize seed data', error);
    }
  }

  private insertSpringMyBatisPlusTemplates() {
    const groupResult = this.run(
      `INSERT INTO template_group (name, description, is_builtin, tags) 
       VALUES (?, ?, ?, ?)`,
      [
        'Spring Boot + MyBatis Plus',
        'Spring Boot 项目代码生成模板（使用 MyBatis Plus）',
        1,
        JSON.stringify(['Java', 'Spring Boot', 'MyBatis Plus', 'Backend']),
      ],
    );

    const groupId = groupResult.lastInsertRowid;
    const templatesDir = join(__dirname, '../../templates/spring-mybatis-plus');

    const templates = [
      {
        fileName: 'Entity.java.njk',
        outputPath: 'src/main/java/{{ global.packagePath }}/entity/{{ table.shortClassName }}.java',
        language: 'java',
        order: 1,
      },
      {
        fileName: 'Mapper.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/mapper/{{ table.shortClassName }}Mapper.java',
        language: 'java',
        order: 2,
      },
      {
        fileName: 'Mapper.xml.njk',
        outputPath: 'src/main/resources/mapper/{{ table.shortClassName }}Mapper.xml',
        language: 'xml',
        order: 3,
      },
      {
        fileName: 'Service.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/service/{{ table.shortClassName }}Service.java',
        language: 'java',
        order: 4,
      },
      {
        fileName: 'ServiceImpl.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/service/impl/{{ table.shortClassName }}ServiceImpl.java',
        language: 'java',
        order: 5,
      },
      {
        fileName: 'Controller.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/controller/{{ table.shortClassName }}Controller.java',
        language: 'java',
        order: 6,
      },
    ];

    templates.forEach((template, index) => {
      const filePath = join(templatesDir, template.fileName);
      const content = readFileSync(filePath, 'utf-8');
      const result = this.run(
        `INSERT INTO template_file (group_id, file_name, output_path, content, language, enabled, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          template.fileName,
          template.outputPath,
          content,
          template.language,
          1,
          template.order,
        ],
      );
      this.logger.debug(`  -> Inserted file ${template.fileName} (id: ${result.lastInsertRowid})`);
    });

    this.logger.log(
      `Inserted ${templates.length} Spring Boot + MyBatis Plus template files (group_id: ${groupId})`,
    );
  }

  private insertTypeScriptFrontendTemplates() {
    const groupResult = this.run(
      `INSERT INTO template_group (name, description, is_builtin, tags) 
       VALUES (?, ?, ?, ?)`,
      [
        'TypeScript Frontend',
        'TypeScript 前端代码生成模板（React + Ant Design）',
        1,
        JSON.stringify(['TypeScript', 'React', 'Ant Design', 'Frontend']),
      ],
    );

    const groupId = groupResult.lastInsertRowid;
    const templatesDir = join(__dirname, '../../templates/typescript-frontend');

    const templates = [
      {
        fileName: 'types.ts.njk',
        outputPath: 'src/types/{{ table.shortCamelName }}.ts',
        language: 'typescript',
        order: 1,
      },
      {
        fileName: 'api.ts.njk',
        outputPath: 'src/api/{{ table.shortCamelName }}.ts',
        language: 'typescript',
        order: 2,
      },
      {
        fileName: 'components.tsx.njk',
        outputPath: 'src/components/{{ table.shortClassName }}Manager.tsx',
        language: 'typescript',
        order: 3,
      },
    ];

    templates.forEach((template, index) => {
      const filePath = join(templatesDir, template.fileName);
      const content = readFileSync(filePath, 'utf-8');
      const result = this.run(
        `INSERT INTO template_file (group_id, file_name, output_path, content, language, enabled, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          template.fileName,
          template.outputPath,
          content,
          template.language,
          1,
          template.order,
        ],
      );
      this.logger.debug(`  -> Inserted file ${template.fileName} (id: ${result.lastInsertRowid})`);
    });

    this.logger.log(
      `Inserted ${templates.length} TypeScript Frontend template files (group_id: ${groupId})`,
    );
  }

  private insertSpringJpaTemplates() {
    const groupResult = this.run(
      `INSERT INTO template_group (name, description, is_builtin, tags) 
       VALUES (?, ?, ?, ?)`,
      [
        'Spring Boot + JPA',
        'Spring Boot 项目代码生成模板（使用 Spring Data JPA）',
        1,
        JSON.stringify(['Java', 'Spring Boot', 'JPA', 'Backend']),
      ],
    );

    const groupId = groupResult.lastInsertRowid;
    const templatesDir = join(__dirname, '../../templates/spring-jpa');

    const templates = [
      {
        fileName: 'Entity.java.njk',
        outputPath: 'src/main/java/{{ global.packagePath }}/entity/{{ table.shortClassName }}.java',
        language: 'java',
        order: 1,
      },
      {
        fileName: 'Repository.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/repository/{{ table.shortClassName }}Repository.java',
        language: 'java',
        order: 2,
      },
      {
        fileName: 'Service.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/service/{{ table.shortClassName }}Service.java',
        language: 'java',
        order: 3,
      },
      {
        fileName: 'ServiceImpl.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/service/impl/{{ table.shortClassName }}ServiceImpl.java',
        language: 'java',
        order: 4,
      },
      {
        fileName: 'Controller.java.njk',
        outputPath:
          'src/main/java/{{ global.packagePath }}/controller/{{ table.shortClassName }}Controller.java',
        language: 'java',
        order: 5,
      },
    ];

    templates.forEach((template, index) => {
      const filePath = join(templatesDir, template.fileName);
      const content = readFileSync(filePath, 'utf-8');
      const result = this.run(
        `INSERT INTO template_file (group_id, file_name, output_path, content, language, enabled, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          template.fileName,
          template.outputPath,
          content,
          template.language,
          1,
          template.order,
        ],
      );
      this.logger.debug(`  -> Inserted file ${template.fileName} (id: ${result.lastInsertRowid})`);
    });

    this.logger.log(
      `Inserted ${templates.length} Spring Boot + JPA template files (group_id: ${groupId})`,
    );
  }

  private insertGoGinGormTemplates() {
    const groupResult = this.run(
      `INSERT INTO template_group (name, description, is_builtin, tags) 
       VALUES (?, ?, ?, ?)`,
      [
        'Go + Gin + GORM (DDD)',
        'Go 项目代码生成模板（Gin + GORM，DDD/整洁架构）',
        1,
        JSON.stringify(['Go', 'Gin', 'GORM', 'DDD', 'Backend']),
      ],
    );

    const groupId = groupResult.lastInsertRowid;
    const templatesDir = join(__dirname, '../../templates/go-gin-gorm');

    const templates = [
      {
        fileName: 'model.go.njk',
        outputPath: 'internal/domain/{{ global.moduleName }}/entity/{{ table.shortCamelName }}.go',
        language: 'go',
        order: 1,
      },
      {
        fileName: 'dto.go.njk',
        outputPath:
          'internal/application/{{ global.moduleName }}/dto/{{ table.shortCamelName }}_dto.go',
        language: 'go',
        order: 2,
      },
      {
        fileName: 'repository.go.njk',
        outputPath:
          'internal/infrastructure/persistence/{{ global.moduleName }}/{{ table.shortCamelName }}_repository.go',
        language: 'go',
        order: 3,
      },
      {
        fileName: 'service.go.njk',
        outputPath:
          'internal/application/{{ global.moduleName }}/service/{{ table.shortCamelName }}_service.go',
        language: 'go',
        order: 4,
      },
      {
        fileName: 'handler.go.njk',
        outputPath:
          'internal/interfaces/http/{{ global.moduleName }}/{{ table.shortCamelName }}_handler.go',
        language: 'go',
        order: 5,
      },
      {
        fileName: 'router.go.njk',
        outputPath:
          'internal/interfaces/http/{{ global.moduleName }}/{{ table.shortCamelName }}_router.go',
        language: 'go',
        order: 6,
      },
    ];

    templates.forEach((template) => {
      const filePath = join(templatesDir, template.fileName);
      const content = readFileSync(filePath, 'utf-8');
      const result = this.run(
        `INSERT INTO template_file (group_id, file_name, output_path, content, language, enabled, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          template.fileName,
          template.outputPath,
          content,
          template.language,
          1,
          template.order,
        ],
      );
      this.logger.debug(`  -> Inserted file ${template.fileName} (id: ${result.lastInsertRowid})`);
    });

    this.logger.log(`Inserted ${templates.length} Go template files (group_id: ${groupId})`);
  }

  query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    // 查询不需要保存数据库
    return results;
  }

  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const hasRow = stmt.step();
    const result = hasRow ? (stmt.getAsObject() as T) : undefined;
    stmt.free();
    return result;
  }

  private inTransaction = false;

  run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();

    const result = this.db.exec('SELECT last_insert_rowid() as id');
    const lastInsertRowid = (result[0]?.values[0]?.[0] as number) || 0;
    const changes = this.db.getRowsModified();

    // 只在非事务模式下自动保存数据库
    if (!this.inTransaction) {
      this.saveDatabase();
    }

    return {
      lastInsertRowid,
      changes,
    };
  }

  transaction(fn: () => void): void {
    this.inTransaction = true;
    try {
      this.db.exec('BEGIN TRANSACTION');
      fn();
      this.db.exec('COMMIT');
      this.saveDatabase();
    } catch (error) {
      try {
        this.db.exec('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error('Failed to rollback transaction', rollbackError);
      }
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }
}

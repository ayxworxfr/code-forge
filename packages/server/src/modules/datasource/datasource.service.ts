import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDataSourceDto } from './dto/create-datasource.dto';
import { UpdateDataSourceDto } from './dto/update-datasource.dto';
import { DataSource, TableInfo, ColumnInfo, TableDetail } from './entities/datasource.entity';
import { createConnection, Connection } from 'mysql2/promise';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Parser } from 'node-sql-parser';
import type { AST } from 'node-sql-parser';

@Injectable()
export class DataSourceService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly parser = new Parser();

  constructor(private readonly databaseService: DatabaseService) {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long';
    this.key = Buffer.from(encryptionKey.padEnd(32, '0').substring(0, 32));
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  findAll(): DataSource[] {
    const sources = this.databaseService.query<DataSource>(
      'SELECT * FROM data_source ORDER BY created_at DESC',
    );
    return sources.map((source) => ({
      ...source,
      password: '******',
    }));
  }

  findOne(id: number): DataSource {
    const source = this.databaseService.get<DataSource>('SELECT * FROM data_source WHERE id = ?', [
      id,
    ]);
    if (!source) {
      throw new NotFoundException(`DataSource with ID ${id} not found`);
    }
    return {
      ...source,
      password: '******',
    };
  }

  create(dto: CreateDataSourceDto): DataSource {
    const encryptedPassword = this.encrypt(dto.password);
    const result = this.databaseService.run(
      `INSERT INTO data_source (name, host, port, username, password, database_name, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.name,
        dto.host,
        dto.port,
        dto.username,
        encryptedPassword,
        dto.database_name,
        dto.description || '',
      ],
    );
    return this.findOne(result.lastInsertRowid as number);
  }

  update(id: number, dto: UpdateDataSourceDto): DataSource {
    const existing = this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`DataSource with ID ${id} not found`);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      params.push(dto.name);
    }
    if (dto.host !== undefined) {
      updates.push('host = ?');
      params.push(dto.host);
    }
    if (dto.port !== undefined) {
      updates.push('port = ?');
      params.push(dto.port);
    }
    if (dto.username !== undefined) {
      updates.push('username = ?');
      params.push(dto.username);
    }
    if (dto.password !== undefined) {
      updates.push('password = ?');
      params.push(this.encrypt(dto.password));
    }
    if (dto.database_name !== undefined) {
      updates.push('database_name = ?');
      params.push(dto.database_name);
    }
    if (dto.description !== undefined) {
      updates.push('description = ?');
      params.push(dto.description);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      this.databaseService.run(`UPDATE data_source SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return this.findOne(id);
  }

  remove(id: number): void {
    const existing = this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`DataSource with ID ${id} not found`);
    }
    this.databaseService.run('DELETE FROM data_source WHERE id = ?', [id]);
  }

  async testConnection(
    id: number,
  ): Promise<{ success: boolean; message: string; version?: string }> {
    const source = this.databaseService.get<DataSource>('SELECT * FROM data_source WHERE id = ?', [
      id,
    ]);
    if (!source) {
      throw new NotFoundException(`DataSource with ID ${id} not found`);
    }

    try {
      const password = this.decrypt(source.password);
      const connection = await createConnection({
        host: source.host,
        port: source.port,
        user: source.username,
        password,
        database: source.database_name,
        connectTimeout: 5000,
      });

      const [rows] = await connection.query('SELECT VERSION() as version');
      const version = (rows as any)[0].version;

      await connection.end();
      return {
        success: true,
        message: 'Connection successful',
        version,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async testConnectionByConfig(
    dto: CreateDataSourceDto,
  ): Promise<{ success: boolean; message: string; version?: string }> {
    let connection: Connection | null = null;
    try {
      connection = await createConnection({
        host: dto.host,
        port: dto.port,
        user: dto.username,
        password: dto.password,
        database: dto.database_name,
        connectTimeout: 5000,
      });

      const [rows] = await connection.query('SELECT VERSION() as version');
      const version = (rows as any)[0]?.version;
      return {
        success: true,
        message: 'Connection successful',
        version,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  async getTables(id: number): Promise<TableInfo[]> {
    const source = this.databaseService.get<DataSource>('SELECT * FROM data_source WHERE id = ?', [
      id,
    ]);
    if (!source) {
      throw new NotFoundException(`DataSource with ID ${id} not found`);
    }

    let connection: Connection;
    try {
      const password = this.decrypt(source.password);
      connection = await createConnection({
        host: source.host,
        port: source.port,
        user: source.username,
        password: password,
        database: source.database_name,
        connectTimeout: 5000,
      });

      const [rows] = await connection.query(
        `SELECT
          TABLE_NAME as tableName,
          TABLE_COMMENT as tableComment,
          ENGINE as engine,
          CREATE_TIME as createTime
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME`,
        [source.database_name],
      );

      await connection.end();
      return rows as TableInfo[];
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tables: ${error.message}`);
    }
  }

  async getTableDetail(id: number, tableName: string): Promise<TableDetail> {
    const source = this.databaseService.get<DataSource>('SELECT * FROM data_source WHERE id = ?', [
      id,
    ]);
    if (!source) {
      throw new NotFoundException(`DataSource with ID ${id} not found`);
    }

    let connection: Connection;
    try {
      const password = this.decrypt(source.password);
      connection = await createConnection({
        host: source.host,
        port: source.port,
        user: source.username,
        password: password,
        database: source.database_name,
        connectTimeout: 5000,
      });

      const [tableRows] = await connection.query(
        `SELECT TABLE_COMMENT as tableComment
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [source.database_name, tableName],
      );

      const tableComment = (tableRows as any)[0]?.tableComment || '';

      const [columnRows] = await connection.query(
        `SELECT
          COLUMN_NAME as columnName,
          DATA_TYPE as dataType,
          COLUMN_TYPE as columnType,
          COLUMN_COMMENT as columnComment,
          COLUMN_KEY as columnKey,
          IS_NULLABLE as isNullable,
          COLUMN_DEFAULT as columnDefault,
          EXTRA as extra,
          CHARACTER_MAXIMUM_LENGTH as characterMaxLength,
          NUMERIC_PRECISION as numericPrecision,
          NUMERIC_SCALE as numericScale
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
        [source.database_name, tableName],
      );

      const columns: ColumnInfo[] = (columnRows as any[]).map((col) => ({
        columnName: col.columnName,
        dataType: col.dataType,
        columnType: col.columnType,
        columnComment: col.columnComment || '',
        isPrimaryKey: col.columnKey === 'PRI',
        isNullable: col.isNullable === 'YES',
        columnDefault: col.columnDefault,
        extra: col.extra || '',
        characterMaxLength: col.characterMaxLength,
        numericPrecision: col.numericPrecision,
        numericScale: col.numericScale,
      }));

      await connection.end();

      return {
        tableName,
        tableComment,
        columns,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch table detail: ${error.message}`);
    }
  }

  parseDdl(ddl: string): TableDetail {
    const tables = this.parseDdlTables(ddl);
    if (tables.length === 0) {
      throw new BadRequestException('Failed to parse DDL: no CREATE TABLE statement found');
    }
    return tables[0];
  }

  parseDdlTables(ddl: string): TableDetail[] {
    try {
      const ast = this.parser.astify(ddl, { database: 'MySQL' });
      const statements = Array.isArray(ast) ? ast : [ast];
      const createTables = statements.filter(
        (statement: AST) => statement.type === 'create' && (statement as any).keyword === 'table',
      );

      if (createTables.length === 0) {
        throw new Error('Invalid DDL: Not a CREATE TABLE statement');
      }

      return createTables.map((createTable: any) => {
        const tableName =
          typeof createTable.table[0].table === 'string'
            ? createTable.table[0].table
            : createTable.table[0].table.value;

        const columns: ColumnInfo[] = createTable.create_definitions
          .filter((def: any) => def.resource === 'column')
          .map((def: any) => {
            const columnName = def.column.column;
            const dataType = def.definition.dataType.toLowerCase();
            let columnType = dataType;

            if (def.definition.length !== undefined) {
              columnType += `(${def.definition.length})`;
            }

            const isPrimaryKey = createTable.create_definitions.some(
              (d: any) =>
                d.resource === 'constraint' &&
                d.constraint_type === 'primary key' &&
                d.definition?.some((col: any) => col.column === columnName),
            );

            return {
              columnName,
              dataType,
              columnType,
              columnComment: def.comment?.value?.value || '',
              isPrimaryKey,
              isNullable: !def.nullable || def.nullable.type !== 'not null',
              columnDefault: def.default_val?.value?.value || null,
              extra: def.auto_increment ? 'auto_increment' : '',
              characterMaxLength: def.definition.length || null,
              numericPrecision: null,
              numericScale: null,
            };
          });

        const tableCommentDef = createTable.create_definitions.find(
          (def: any) => def.keyword === 'comment',
        ) as any;
        const tableComment =
          tableCommentDef?.value?.value || tableCommentDef?.comment?.value?.value || '';

        return {
          tableName,
          tableComment,
          columns,
        };
      });
    } catch (error) {
      throw new BadRequestException(`Failed to parse DDL: ${error.message}`);
    }
  }
}

export interface DataSource {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDataSourceDto {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
  description?: string;
}

export interface UpdateDataSourceDto extends Partial<CreateDataSourceDto> {}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  version?: string;
  latency?: number;
}

export interface TableInfo {
  tableName: string;
  tableComment?: string;
  engine?: string;
  createTime?: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  columnType: string;
  comment?: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isAutoIncrement: boolean;
  columnLength?: number;
  defaultValue?: string;
  javaField: string;
  javaType: string;
  tsField: string;
  tsType: string;
  jdbcType: string;
}

export interface TableDetail {
  tableName: string;
  tableComment?: string;
  columns: ColumnInfo[];
}

export interface ParseDdlDto {
  ddl: string;
}

export interface ParseDdlResult {
  tables: TableDetail[];
}

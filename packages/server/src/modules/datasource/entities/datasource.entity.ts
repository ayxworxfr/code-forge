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

export interface TableInfo {
  tableName: string;
  tableComment: string;
  engine: string;
  createTime: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  columnType: string;
  columnComment: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  columnDefault: string | null;
  extra: string;
  characterMaxLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
}

export interface TableDetail {
  tableName: string;
  tableComment: string;
  columns: ColumnInfo[];
}

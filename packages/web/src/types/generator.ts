export interface PreviewRequest {
  dataSourceId?: number;
  ddl?: string;
  tableName: string;
  templateFileId: number;
  globalConfig: GeneratorConfig;
}

export interface GenerateRequest {
  dataSourceId?: number;
  ddl?: string;
  tableNames: string[];
  templateGroupId: number;
  templateFileIds?: number[];
  globalConfig: GeneratorConfig;
}

export interface GeneratorConfig {
  author?: string;
  packageName?: string;
  moduleName?: string;
  tablePrefix?: string;
  date?: string;
  idType?: string;
  [key: string]: any;
}

export interface PreviewResult {
  code: string;
  filePath: string;
}

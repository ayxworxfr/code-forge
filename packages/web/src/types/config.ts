export interface GlobalConfig {
  [key: string]: string;
}

export interface ConfigItem {
  key: string;
  value: string;
  description?: string;
}

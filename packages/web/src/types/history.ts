export interface GenHistory {
  id: number;
  datasource_id?: number;
  datasource_name?: string;
  table_names: string;
  template_group_id?: number;
  template_group_name?: string;
  config_snapshot?: string;
  file_count: number;
  created_at: string;
}

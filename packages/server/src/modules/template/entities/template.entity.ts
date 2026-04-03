export interface TemplateGroup {
  id: number;
  name: string;
  description?: string;
  is_builtin: number;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateFile {
  id: number;
  group_id: number;
  file_name: string;
  output_path: string;
  content: string;
  language?: string;
  enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateGroupWithFiles extends TemplateGroup {
  files: TemplateFile[];
}

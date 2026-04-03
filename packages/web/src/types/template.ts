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
  language: string;
  enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateGroupWithFiles extends TemplateGroup {
  files: TemplateFile[];
}

export interface CreateTemplateGroupDto {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateTemplateGroupDto extends Partial<CreateTemplateGroupDto> {}

export interface CreateTemplateFileDto {
  group_id: number;
  file_name: string;
  output_path: string;
  content: string;
  language: string;
  enabled?: number;
  sort_order?: number;
}

export interface UpdateTemplateFileDto extends Partial<Omit<CreateTemplateFileDto, 'group_id'>> {}

export interface TypeMapping {
  id: number;
  source_type: string;
  java_type: string;
  ts_type: string;
  jdbc_type: string;
  is_builtin: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTypeMappingDto {
  source_type: string;
  java_type: string;
  ts_type: string;
  jdbc_type: string;
}

export interface UpdateTypeMappingDto extends Partial<CreateTypeMappingDto> {}

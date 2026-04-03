export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageQuery {
  current?: number;
  size?: number;
  [key: string]: any;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

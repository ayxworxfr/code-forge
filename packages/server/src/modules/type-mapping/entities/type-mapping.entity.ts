/**
 * 类型映射实体定义
 */

export interface TypeMapping {
  id: number;
  source_type: string; // MySQL 数据类型
  java_type: string; // Java 类型
  ts_type: string; // TypeScript 类型
  jdbc_type: string; // JDBC 类型
  is_builtin: number; // 0: 自定义, 1: 内置
  created_at: string;
  updated_at: string;
}

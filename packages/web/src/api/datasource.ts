import request from './request';
import type {
  DataSource,
  CreateDataSourceDto,
  UpdateDataSourceDto,
  TestConnectionResult,
  TableInfo,
  TableDetail,
  ParseDdlDto,
} from '@/types';

export const datasourceApi = {
  findAll: () => {
    return request.get<any>('/datasource').then((res) => res.data.data as DataSource[]);
  },

  findOne: (id: number) => {
    return request.get<any>(`/datasource/${id}`).then((res) => res.data.data as DataSource);
  },

  create: (data: CreateDataSourceDto) => {
    return request.post<any>('/datasource', data).then((res) => res.data.data as DataSource);
  },

  update: (id: number, data: UpdateDataSourceDto) => {
    return request.put<any>(`/datasource/${id}`, data).then((res) => res.data.data as DataSource);
  },

  remove: (id: number) => {
    return request.delete<any>(`/datasource/${id}`).then((res) => res.data);
  },

  testConnection: (id: number) => {
    return request
      .post<any>(`/datasource/test/${id}`)
      .then((res) => res.data.data as TestConnectionResult);
  },

  testConnectionByConfig: (data: CreateDataSourceDto) => {
    return request
      .post<any>('/datasource/test', data)
      .then((res) => res.data.data as TestConnectionResult);
  },

  getTables: (id: number) => {
    return request.get<any>(`/datasource/${id}/tables`).then((res) => res.data.data as TableInfo[]);
  },

  getTableDetail: (id: number, tableName: string) => {
    return request
      .get<any>(`/datasource/${id}/tables/${tableName}`)
      .then((res) => res.data.data as TableDetail);
  },

  parseDdl: (data: ParseDdlDto) => {
    return request
      .post<any>('/datasource/parse-ddl', data)
      .then((res) => res.data.data as TableDetail[]);
  },
};

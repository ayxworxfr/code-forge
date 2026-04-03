import request from './request';
import type { TypeMapping, CreateTypeMappingDto, UpdateTypeMappingDto } from '@/types';

export const typeMappingApi = {
  findAll: () => {
    return request.get<any>('/type-mapping').then((res) => res.data.data as TypeMapping[]);
  },

  findOne: (id: number) => {
    return request.get<any>(`/type-mapping/${id}`).then((res) => res.data.data as TypeMapping);
  },

  create: (data: CreateTypeMappingDto) => {
    return request.post<any>('/type-mapping', data).then((res) => res.data.data as TypeMapping);
  },

  update: (id: number, data: UpdateTypeMappingDto) => {
    return request
      .put<any>(`/type-mapping/${id}`, data)
      .then((res) => res.data.data as TypeMapping);
  },

  remove: (id: number) => {
    return request.delete<any>(`/type-mapping/${id}`).then((res) => res.data);
  },

  reset: () => {
    return request.post<any>('/type-mapping/reset').then((res) => res.data);
  },
};

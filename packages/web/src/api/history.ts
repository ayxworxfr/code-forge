import request from './request';
import type { GenHistory } from '@/types';

export const historyApi = {
  findAll: (limit?: number) => {
    return request
      .get<any>('/history', { params: { limit } })
      .then((res) => res.data.data as GenHistory[]);
  },

  remove: (id: number) => {
    return request.delete<any>(`/history/${id}`).then((res) => res.data);
  },

  clear: () => {
    return request.delete<any>('/history').then((res) => res.data);
  },
};

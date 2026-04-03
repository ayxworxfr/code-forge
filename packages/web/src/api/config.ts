import request from './request';
import type { GlobalConfig } from '@/types';

export const configApi = {
  getAll: () => {
    return request.get<any>('/config').then((res) => res.data.data as GlobalConfig);
  },

  updateBatch: (configs: Record<string, string>) => {
    return request.put<any>('/config', configs).then((res) => res.data);
  },
};

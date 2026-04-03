import request from './request';
import type { PreviewRequest, GenerateRequest, PreviewResult } from '@/types';

export const generatorApi = {
  preview: (data: PreviewRequest) => {
    return request
      .post<any>('/generator/preview', data)
      .then((res) => res.data.data as PreviewResult);
  },

  generateBlob: async (data: GenerateRequest): Promise<Blob> => {
    const response = await request.post('/generator/generate', data, {
      responseType: 'blob',
    });

    return new Blob([response.data], { type: 'application/zip' });
  },

  generate: async (data: GenerateRequest) => {
    const blob = await generatorApi.generateBlob(data);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-code-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

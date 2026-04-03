import request from './request';
import type {
  TemplateGroup,
  TemplateFile,
  TemplateGroupWithFiles,
  CreateTemplateGroupDto,
  UpdateTemplateGroupDto,
  CreateTemplateFileDto,
  UpdateTemplateFileDto,
} from '@/types';

export interface ImportZipPreviewResult {
  groupName: string;
  fileCount: number;
  hasDuplicateGroupName: boolean;
  hasDuplicateFileNames: boolean;
}

const parseDownloadFileName = (contentDisposition?: string): string => {
  if (!contentDisposition) {
    return 'template-group.zip';
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // 忽略解码失败，回退到普通 filename
    }
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return 'template-group.zip';
};

export const templateApi = {
  findAllGroups: () => {
    return request.get<any>('/template/groups').then((res) => res.data.data as TemplateGroup[]);
  },

  findOneGroup: (id: number) => {
    return request.get<any>(`/template/groups/${id}`).then((res) => res.data.data as TemplateGroup);
  },

  findGroupWithFiles: (id: number) => {
    return request
      .get<any>(`/template/groups/${id}/files`)
      .then((res) => res.data.data as TemplateGroupWithFiles);
  },

  createGroup: (data: CreateTemplateGroupDto) => {
    return request
      .post<any>('/template/groups', data)
      .then((res) => res.data.data as TemplateGroup);
  },

  updateGroup: (id: number, data: UpdateTemplateGroupDto) => {
    return request
      .put<any>(`/template/groups/${id}`, data)
      .then((res) => res.data.data as TemplateGroup);
  },

  removeGroup: (id: number) => {
    return request.delete<any>(`/template/groups/${id}`).then((res) => res.data);
  },

  cloneGroup: (id: number, name: string) => {
    return request
      .post<any>(`/template/groups/${id}/clone`, { name })
      .then((res) => res.data.data as TemplateGroup);
  },

  exportGroupZip: async (id: number) => {
    const response = await request.get(`/template/groups/${id}/export`, {
      responseType: 'blob',
    });
    const contentDisposition =
      (response.headers?.['content-disposition'] as string | undefined) ||
      (response.headers?.['Content-Disposition'] as string | undefined);
    const fileName = parseDownloadFileName(contentDisposition);
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  importGroupZip: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request
      .post<any>('/template/groups/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data.data as TemplateGroupWithFiles);
  },

  previewImportGroupZip: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request
      .post<any>('/template/groups/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data.data as ImportZipPreviewResult);
  },

  importGroupZipWithName: async (file: File, groupName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupName', groupName);
    return request
      .post<any>('/template/groups/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data.data as TemplateGroupWithFiles);
  },

  findOneFile: (id: number) => {
    return request.get<any>(`/template/files/${id}`).then((res) => res.data.data as TemplateFile);
  },

  createFile: (data: CreateTemplateFileDto) => {
    return request.post<any>('/template/files', data).then((res) => res.data.data as TemplateFile);
  },

  updateFile: (id: number, data: UpdateTemplateFileDto) => {
    return request
      .put<any>(`/template/files/${id}`, data)
      .then((res) => res.data.data as TemplateFile);
  },

  removeFile: (id: number) => {
    return request.delete<any>(`/template/files/${id}`).then((res) => res.data);
  },

  updateFilesOrder: (fileOrders: { id: number; sort_order: number }[]) => {
    return request.put<any>('/template/files/order', fileOrders).then((res) => res.data);
  },
};

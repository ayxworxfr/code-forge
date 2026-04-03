import axios, { AxiosError } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse;

    if (res.code !== undefined && res.code !== 0) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }

    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const errorMessage = error.response?.data?.message || error.message || '网络错误';
    message.error(errorMessage);
    return Promise.reject(error);
  },
);

export default request;

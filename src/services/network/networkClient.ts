import axios, {AxiosError} from 'axios';
import {API_BASE_URL} from '@/services/api/apiConfig';

type ServiceErrorResponse = {
  messageId?: string;
  userDescription?: string;
  subErrors?: unknown;
  message?: string;
};

export const networkClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

networkClient.interceptors.request.use(config => {
  console.log('[network][request]', {
    method: config.method,
    url: `${config.baseURL || ''}${config.url || ''}`,
    params: config.params,
    data: config.data
  });

  return config;
});

networkClient.interceptors.response.use(
  response => {
    console.log('[network][response]', {
      method: response.config.method,
      url: `${response.config.baseURL || ''}${response.config.url || ''}`,
      status: response.status,
      data: response.data
    });

    return response;
  },
  error => {
    const axiosError = error as AxiosError;
    console.log('[network][error]', {
      method: axiosError.config?.method,
      url: `${axiosError.config?.baseURL || ''}${axiosError.config?.url || ''}`,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message
    });

    return Promise.reject(error);
  }
);

export const getServiceErrorMessage = (error: unknown, fallbackMessage = 'İstek başarısız oldu.'): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ServiceErrorResponse | undefined;

    if (typeof payload?.userDescription === 'string' && payload.userDescription.trim().length > 0) {
      return payload.userDescription;
    }

    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
  }

  return fallbackMessage;
};

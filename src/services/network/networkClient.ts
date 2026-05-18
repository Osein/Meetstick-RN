import axios, {AxiosError} from 'axios';
import {API_BASE_URL} from '@/services/api/apiConfig';
import {MeetstickSecureKeyValueStorage} from '@/services/storage/MeetstickSecureKeyValueStorage';

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

const secureStorage = new MeetstickSecureKeyValueStorage();
let cachedAccessToken: string | undefined;
let lastAccessTokenReadAt = 0;

const getLocalAccessToken = async (): Promise<string | undefined> => {
  const now = Date.now();
  if (cachedAccessToken && now - lastAccessTokenReadAt < 30_000) {
    return cachedAccessToken;
  }

  const profile = await secureStorage.getUserProfile();
  const token = profile?.accessToken?.trim();
  cachedAccessToken = token && token.length > 0 ? token : undefined;
  lastAccessTokenReadAt = now;
  return cachedAccessToken;
};

networkClient.interceptors.request.use(async config => {
  const headersAny = config.headers as
    | {Authorization?: string; authorization?: string; set?: (name: string, value: string) => void}
    | undefined;
  const hasAuthorization = Boolean(headersAny?.Authorization || headersAny?.authorization);

  if (!hasAuthorization) {
    const token = await getLocalAccessToken();
    if (token) {
      if (headersAny?.set) {
        headersAny.set('Authorization', `Bearer ${token}`);
      } else {
        const fallbackHeaders = (config.headers || {}) as Record<string, string>;
        fallbackHeaders.Authorization = `Bearer ${token}`;
        config.headers = fallbackHeaders as typeof config.headers;
      }
    }
  }

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

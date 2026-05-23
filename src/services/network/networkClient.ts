import axios, {AxiosError} from 'axios';
import {API_BASE_URL} from '@/services/api/apiConfig';
import {MeetstickSecureKeyValueStorage} from '@/services/storage/MeetstickSecureKeyValueStorage';
import {markSessionExpired} from '@/services/auth/authSessionService';

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
const inFlightControllers = new Set<AbortController>();

const logNetwork = (scope: 'request' | 'response' | 'error', payload: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const printable = JSON.stringify(
    {
      timestamp,
      ...payload
    },
    null,
    2
  );
  console.log(`[network][${scope}] ${printable}`);
};

const getLocalAccessToken = async (): Promise<string | undefined> => {
  const profile = await secureStorage.getUserProfile();
  const token = profile?.accessToken?.trim();
  return token && token.length > 0 ? token : undefined;
};

export const cancelAllInFlightRequests = () => {
  inFlightControllers.forEach(controller => controller.abort('SESSION_EXPIRED'));
  inFlightControllers.clear();
};

networkClient.interceptors.request.use(async config => {
  const controller = new AbortController();
  config.signal = controller.signal;
  (config as typeof config & {_abortController?: AbortController})._abortController = controller;
  inFlightControllers.add(controller);

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

  logNetwork('request', {
    method: config.method,
    url: `${config.baseURL || ''}${config.url || ''}`,
    headers:
      typeof (config.headers as {toJSON?: () => unknown})?.toJSON === 'function'
        ? (config.headers as {toJSON: () => unknown}).toJSON()
        : config.headers,
    params: config.params,
    data: config.data
  });

  return config;
});

networkClient.interceptors.response.use(
  response => {
    const responseConfig = response.config as typeof response.config & {_abortController?: AbortController};
    if (responseConfig._abortController) {
      inFlightControllers.delete(responseConfig._abortController);
    }

    logNetwork('response', {
      method: response.config.method,
      url: `${response.config.baseURL || ''}${response.config.url || ''}`,
      status: response.status,
      data: response.data
    });

    return response;
  },
  error => {
    const axiosError = error as AxiosError;
    const errorConfig = axiosError.config as (typeof axiosError.config & {_abortController?: AbortController}) | undefined;
    if (errorConfig?._abortController) {
      inFlightControllers.delete(errorConfig._abortController);
    }

    logNetwork('error', {
      method: axiosError.config?.method,
      url: `${axiosError.config?.baseURL || ''}${axiosError.config?.url || ''}`,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message
    });

    if (axiosError.response?.status === 401) {
      cancelAllInFlightRequests();
      markSessionExpired();
    }

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

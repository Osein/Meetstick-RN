export const API_BASE_URL = __DEV__
  ? 'https://meetstick-dev.chroniclesofa.dev'
  : 'https://api.meetstick.app';

export const buildApiUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
};

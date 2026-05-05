import {buildApiUrl} from '@/services/api/apiConfig';
import {Interest} from '@/types';

type ServiceErrorResponse = {
  messageId?: string;
  userDescription?: string;
  subErrors?: unknown;
  message?: string;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ServiceErrorResponse;

    if (typeof data.userDescription === 'string' && data.userDescription.trim().length > 0) {
      return data.userDescription;
    }

    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // noop
  }

  return 'İlgi alanları alınamadı.';
};

const normalizeInterest = (item: unknown): Interest | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const raw = item as {id?: unknown; name?: unknown; title?: unknown};
  const id =
    typeof raw.id === 'string' || typeof raw.id === 'number'
      ? raw.id
      : raw.id != null
        ? String(raw.id)
        : '';

  const title =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.title === 'string'
        ? raw.title
        : raw.name != null
          ? String(raw.name)
          : raw.title != null
            ? String(raw.title)
            : '';

  if (!id || !title.trim()) {
    return null;
  }

  return {
    id,
    title: title.trim()
  };
};

export const getInterests = async (): Promise<Interest[]> => {
  const response = await fetch(buildApiUrl('/v1/interests'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const payload = (await response.json()) as unknown;
  const rawList = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as {interests?: unknown[]}).interests)
      ? (payload as {interests: unknown[]}).interests
      : payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown[]}).data)
        ? (payload as {data: unknown[]}).data
        : [];

  return rawList.map(normalizeInterest).filter((item): item is Interest => item !== null);
};

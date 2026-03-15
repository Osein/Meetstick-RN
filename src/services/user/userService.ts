import {buildApiUrl} from '@/services/api/apiConfig';

type UpdateLocationDistancePayload = {
  locationDistance: number;
  accessToken?: string;
};

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

  return 'İstek başarısız oldu.';
};

export const updateLocationDistance = async ({
  locationDistance,
  accessToken
}: UpdateLocationDistancePayload): Promise<void> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildApiUrl('/v1/user/location-distance'), {
    method: 'POST',
    headers,
    body: JSON.stringify({locationDistance})
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }
};

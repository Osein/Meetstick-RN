import {buildApiUrl} from '@/services/api/apiConfig';
import {Interest} from '@/types';

type ServiceErrorResponse = {
  messageId?: string;
  userDescription?: string;
  subErrors?: unknown;
  message?: string;
};

export type UserProfileDetail = {
  id: string;
  name: string;
  isApproved: boolean;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  about?: string;
  photos: string[];
  interests: Interest[];
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

  return 'Kullanıcı detayı alınamadı.';
};

export const getUserProfileById = async ({
  userId,
  accessToken
}: {
  userId: string;
  accessToken?: string;
}): Promise<UserProfileDetail> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildApiUrl(`/v1/users/${encodeURIComponent(userId)}`), {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as {
    id?: unknown;
    name?: unknown;
    isApproved?: unknown;
    gender?: unknown;
    age?: unknown;
    about?: unknown;
    photos?: Array<{url?: unknown; photoUrl?: unknown}>;
    interests?: Array<{id?: unknown; name?: unknown; title?: unknown}>;
  };

  const id = typeof data.id === 'string' ? data.id : userId;
  const name = typeof data.name === 'string' ? data.name : 'Kullanıcı';
  const isApproved = data.isApproved === true;
  const gender =
    data.gender === 'male' || data.gender === 'female' || data.gender === 'other' ? data.gender : undefined;

  const photos = Array.isArray(data.photos)
    ? data.photos
        .map(photo => {
          if (typeof photo?.url === 'string') {
            return photo.url;
          }
          if (typeof photo?.photoUrl === 'string') {
            return photo.photoUrl;
          }
          return null;
        })
        .filter((photo): photo is string => !!photo)
    : [];

  const interests: Interest[] = Array.isArray(data.interests)
    ? data.interests
        .map(item => {
          const interestId =
            typeof item?.id === 'string' || typeof item?.id === 'number'
              ? item.id
              : item?.id != null
                ? String(item.id)
                : '';
          const title =
            typeof item?.name === 'string'
              ? item.name
              : typeof item?.title === 'string'
                ? item.title
                : item?.name != null
                  ? String(item.name)
                  : item?.title != null
                    ? String(item.title)
                    : '';

          if (!interestId || !title.trim()) {
            return null;
          }

          return {
            id: interestId,
            title: title.trim()
          };
        })
        .filter((item): item is Interest => item !== null)
    : [];

  return {
    id,
    name,
    isApproved,
    gender,
    age: typeof data.age === 'number' ? data.age : undefined,
    about: typeof data.about === 'string' ? data.about : undefined,
    photos,
    interests
  };
};

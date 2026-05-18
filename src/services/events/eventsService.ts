import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

type EventDetailUser = {
  id: string;
  name: string;
  isApproved?: boolean;
  avatar?: string;
};

export type EventDetailData = {
  id: string;
  title: string;
  description?: string;
  photos: string[];
  addressText?: string;
  acceptedCount?: number;
  isHost: boolean;
  myJoinStatus?: string | null;
  host?: EventDetailUser;
  acceptedParticipants: EventDetailUser[];
  applicants: EventDetailUser[];
};

export type CreateEventPayload = {
  title: string;
  description: string;
  participantCount: number;
  isFutureEvent: boolean;
  eventDateTime?: string;
  location: {
    addressText: string;
    latitude: number;
    longitude: number;
    placeId?: string;
  };
  photos: string[];
};

const normalizeUser = (value: unknown): EventDetailUser | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as {id?: unknown; name?: unknown; isApproved?: unknown; avatar?: unknown};
  const id = typeof raw.id === 'string' ? raw.id : raw.id != null ? String(raw.id) : '';
  const name = typeof raw.name === 'string' ? raw.name : raw.name != null ? String(raw.name) : '';

  if (!id || !name.trim()) {
    return null;
  }

  return {
    id,
    name: name.trim(),
    isApproved: typeof raw.isApproved === 'boolean' ? raw.isApproved : undefined,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : undefined
  };
};

export const getEventById = async ({
  id,
  accessToken
}: {
  id: string;
  accessToken?: string;
}): Promise<EventDetailData> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.get(`/v1/events/${encodeURIComponent(id)}`, {headers});
    const data = response.data as {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    about?: unknown;
    coverPhoto?: unknown;
    photos?: unknown;
    location?: {addressText?: unknown} | null;
    acceptedCount?: unknown;
    isHost?: unknown;
    myJoinStatus?: unknown;
    host?: unknown;
    ownerInsights?: {
      applicants?: {items?: Array<{user?: unknown}>} | null;
      acceptedParticipants?: {items?: Array<{user?: unknown}>} | null;
    } | null;
  };

    const eventId = typeof data.id === 'string' ? data.id : id;
    const title = typeof data.title === 'string' ? data.title : 'Etkinlik';
    const description =
      typeof data.description === 'string'
        ? data.description
        : typeof data.about === 'string'
          ? data.about
          : undefined;

    const photosFromArray = Array.isArray(data.photos)
      ? data.photos
          .map(item => {
            if (!item || typeof item !== 'object') {
              return null;
            }

            const raw = item as {url?: unknown; photoUrl?: unknown};
            if (typeof raw.url === 'string') {
              return raw.url;
            }
            if (typeof raw.photoUrl === 'string') {
              return raw.photoUrl;
            }
            return null;
          })
          .filter((url): url is string => !!url)
      : [];

    const coverPhoto = typeof data.coverPhoto === 'string' ? data.coverPhoto : undefined;
    const photos = photosFromArray.length > 0 ? photosFromArray : coverPhoto ? [coverPhoto] : [];

    const acceptedParticipants =
      data.ownerInsights?.acceptedParticipants?.items
        ?.map(item => normalizeUser(item?.user))
        .filter((user): user is EventDetailUser => user !== null) || [];

    const applicants =
      data.ownerInsights?.applicants?.items
        ?.map(item => normalizeUser(item?.user))
        .filter((user): user is EventDetailUser => user !== null) || [];

    return {
      id: eventId,
      title,
      description,
      photos,
      addressText: typeof data.location?.addressText === 'string' ? data.location.addressText : undefined,
      acceptedCount: typeof data.acceptedCount === 'number' ? data.acceptedCount : acceptedParticipants.length,
      isHost: data.isHost === true,
      myJoinStatus: typeof data.myJoinStatus === 'string' ? data.myJoinStatus : null,
      host: normalizeUser(data.host) || acceptedParticipants[0],
      acceptedParticipants,
      applicants
    };
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Etkinlik detayı alınamadı.'));
  }
};

export const joinEvent = async ({id, accessToken}: {id: string; accessToken?: string}): Promise<void> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    await networkClient.post(`/v1/events/${encodeURIComponent(id)}/join`, {}, {headers});
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Katılım isteği gönderilemedi.'));
  }
};

export const cancelJoinEvent = async ({id, accessToken}: {id: string; accessToken?: string}): Promise<void> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    await networkClient.post(`/v1/events/${encodeURIComponent(id)}/join/cancel`, undefined, {headers});
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Katılım isteği iptal edilemedi.'));
  }
};

export const createEvent = async ({
  payload,
  accessToken
}: {
  payload: CreateEventPayload;
  accessToken?: string;
}): Promise<{id?: string}> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.post('/v1/events', payload, {headers});
    const data = response.data as {id?: unknown} | null;
    return {id: typeof data?.id === 'string' ? data.id : undefined};
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Etkinlik oluşturulamadı.'));
  }
};

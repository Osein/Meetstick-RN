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
  startsAt?: string;
  endsAt?: string | null;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  acceptedCount?: number;
  isHost: boolean;
  myJoinStatus?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | null;
  joinMode?: 'approval' | 'auto';
  host?: EventDetailUser;
  acceptedParticipants: EventDetailUser[];
  acceptedParticipantsCount: number;
  applicants: EventDetailUser[];
  applicantsCount: number;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  addressText: string;
  lat: number;
  lng: number;
  maxCapacity: number;
  joinMode: 'approval' | 'auto';
  date: string;
  createChatRoom: boolean;
  interestIds: Array<string | number>;
  photos: string[];
};

const inferMimeType = (uri: string): string => {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.png')) {
    return 'image/png';
  }
  if (normalized.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
};

const inferFileName = (uri: string, index: number): string => {
  const parts = uri.split('/');
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.includes('.')) {
    return lastPart;
  }

  const mime = inferMimeType(uri);
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return `event-photo-${index + 1}.${extension}`;
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
      coverPhotos?: Array<{url?: unknown}> | unknown;
      photos?: unknown;
      location?: {addressText?: unknown; lat?: unknown; lng?: unknown} | null;
      acceptedCount?: unknown;
      startsAt?: unknown;
      endsAt?: unknown;
      isHost?: unknown;
      myJoinStatus?: unknown;
      joinMode?: unknown;
      host?: unknown;
      ownerInsights?: {
        applicants?: {count?: unknown; items?: Array<{user?: unknown}>} | null;
        acceptedParticipants?: {count?: unknown; items?: Array<{user?: unknown}>} | null;
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

    const photosFromCoverPhotos = Array.isArray(data.coverPhotos)
      ? data.coverPhotos
          .map(item => {
            if (!item || typeof item !== 'object') {
              return null;
            }
            const raw = item as {url?: unknown};
            return typeof raw.url === 'string' ? raw.url : null;
          })
          .filter((url): url is string => !!url)
      : [];

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
    const photos =
      photosFromCoverPhotos.length > 0
        ? photosFromCoverPhotos
        : photosFromArray.length > 0
          ? photosFromArray
          : coverPhoto
            ? [coverPhoto]
            : [];

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
      startsAt: typeof data.startsAt === 'string' ? data.startsAt : undefined,
      endsAt: typeof data.endsAt === 'string' ? data.endsAt : null,
      addressText: typeof data.location?.addressText === 'string' ? data.location.addressText : undefined,
      latitude: typeof data.location?.lat === 'number' ? data.location.lat : undefined,
      longitude: typeof data.location?.lng === 'number' ? data.location.lng : undefined,
      acceptedCount: typeof data.acceptedCount === 'number' ? data.acceptedCount : acceptedParticipants.length,
      isHost: data.isHost === true,
      myJoinStatus:
        data.myJoinStatus === 'pending' ||
        data.myJoinStatus === 'accepted' ||
        data.myJoinStatus === 'rejected' ||
        data.myJoinStatus === 'cancelled'
          ? data.myJoinStatus
          : null,
      joinMode: data.joinMode === 'approval' || data.joinMode === 'auto' ? data.joinMode : undefined,
      host: normalizeUser(data.host) || acceptedParticipants[0],
      acceptedParticipants,
      acceptedParticipantsCount:
        typeof data.ownerInsights?.acceptedParticipants?.count === 'number'
          ? data.ownerInsights.acceptedParticipants.count
          : acceptedParticipants.length,
      applicants,
      applicantsCount:
        typeof data.ownerInsights?.applicants?.count === 'number' ? data.ownerInsights.applicants.count : applicants.length
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
  const headers: Record<string, string> = {'Content-Type': 'multipart/form-data'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('addressText', payload.addressText);
    formData.append('lat', String(payload.lat));
    formData.append('lng', String(payload.lng));
    formData.append('maxCapacity', String(payload.maxCapacity));
    formData.append('joinMode', payload.joinMode);
    formData.append('date', payload.date);
    formData.append('createChatRoom', String(payload.createChatRoom));

    payload.interestIds.forEach(interestId => {
      formData.append('interestIds', String(interestId));
    });

    payload.photos.forEach((uri, index) => {
      formData.append('photos', {
        uri,
        name: inferFileName(uri, index),
        type: inferMimeType(uri)
      } as never);
    });

    const response = await networkClient.post('/v1/events', formData, {headers});
    const data = response.data as {id?: unknown} | null;
    return {id: typeof data?.id === 'string' ? data.id : undefined};
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Etkinlik oluşturulamadı.'));
  }
};

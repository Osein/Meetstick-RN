import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

type EventDetailUser = {
  id: string;
  name: string;
  isApproved?: boolean;
  avatar?: string;
};

export type EventListItem = {
  id: string;
  title: string;
  coverPhoto?: string;
  startsAt?: string;
  personCount?: number;
  host?: EventDetailUser;
  location?: {
    addressText?: string;
    lat?: number;
    lng?: number;
  };
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
  hasActiveJoinRequest: boolean;
  myJoinStatus?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | null;
  joinMode?: 'approval' | 'auto';
  host?: EventDetailUser;
  acceptedParticipants: EventDetailUser[];
  acceptedParticipantsCount: number;
  applicants: EventDetailUser[];
  applicantsCount: number;
};

export type EventListResponse = {
  items: EventListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

const normalizeEventListItem = (value: unknown): EventListItem | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as {
    id?: unknown;
    title?: unknown;
    coverPhoto?: unknown;
    coverPhotos?: Array<{url?: unknown}> | unknown;
    startsAt?: unknown;
    maxCapacity?: unknown;
    acceptedCount?: unknown;
    personCount?: unknown;
    host?: unknown;
    location?: unknown;
  };

  const id = typeof raw.id === 'string' ? raw.id : raw.id != null ? String(raw.id) : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : raw.title != null ? String(raw.title).trim() : '';

  if (!id || !title) {
    return null;
  }

  const coverPhotoFromArray =
    Array.isArray(raw.coverPhotos) && typeof raw.coverPhotos[0]?.url === 'string' ? raw.coverPhotos[0].url : undefined;

  const hostRaw = raw.host && typeof raw.host === 'object' ? (raw.host as EventDetailUser) : undefined;
  const locationRaw =
    raw.location && typeof raw.location === 'object'
      ? (raw.location as {addressText?: string; lat?: number; lng?: number})
      : undefined;

  return {
    id,
    title,
    coverPhoto: typeof raw.coverPhoto === 'string' ? raw.coverPhoto : coverPhotoFromArray,
    startsAt: typeof raw.startsAt === 'string' ? raw.startsAt : undefined,
    personCount:
      typeof raw.personCount === 'number'
        ? raw.personCount
        : typeof raw.maxCapacity === 'number'
          ? raw.maxCapacity
        : typeof raw.acceptedCount === 'number'
          ? raw.acceptedCount
          : undefined,
    host: hostRaw,
    location: locationRaw
  };
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
      hasActiveJoinRequest?: unknown;
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
      hasActiveJoinRequest: data.hasActiveJoinRequest === true,
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

export const deleteEvent = async ({id, accessToken}: {id: string; accessToken?: string}): Promise<void> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    await networkClient.delete(`/v1/events/${encodeURIComponent(id)}`, {headers});
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Etkinlik silinemedi.'));
  }
};

export const getEvents = async ({
  accessToken,
  query,
  interestId,
  lat,
  lng
}: {
  accessToken?: string;
  query?: string;
  interestId?: string | number;
  lat?: number;
  lng?: number;
}): Promise<EventListItem[]> => {
  const response = await getEventsPage({
    accessToken,
    query,
    interestId,
    lat,
    lng
  });

  return response.items;
};

export const getEventsPage = async ({
  accessToken,
  query,
  interestId,
  lat,
  lng,
  page = 1,
  limit = 20
}: {
  accessToken?: string;
  query?: string;
  interestId?: string | number;
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
}): Promise<EventListResponse> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // Rule: query-based search sends only query (+ optional pagination).
  // Nearby discovery sends lat/lng and must not rely on query.
  const hasQuery = Boolean(query && query.trim().length > 0);
  if (!hasQuery && (typeof lat !== 'number' || typeof lng !== 'number')) {
    throw new Error('Konum bilgisi bekleniyor.');
  }

  const params: Record<string, string | number> = {page, limit};
  const resolvedLat = lat;
  const resolvedLng = lng;

  if (hasQuery) {
    params.query = query!.trim();
  } else {
    params.lat = resolvedLat as number;
    params.lng = resolvedLng as number;
  }

  if (interestId != null && String(interestId).trim().length > 0) {
    params.interestId = String(interestId);
  }

  try {
    const response = await networkClient.get('/v1/events', {headers, params});
    const payload = response.data as
      | unknown[]
      | {
          items?: unknown[];
          data?: unknown[];
          pagination?: {
            page?: unknown;
            limit?: unknown;
            total?: unknown;
            totalPages?: unknown;
          };
        };

    const items = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as {items?: unknown[]}).items)
        ? (payload as {items: unknown[]}).items
        : payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown[]}).data)
          ? (payload as {data: unknown[]}).data
          : [];

    const normalizedItems = items.map(normalizeEventListItem).filter((item): item is EventListItem => item !== null);
    const payloadPagination =
      payload && !Array.isArray(payload) && typeof payload === 'object' ? payload.pagination : undefined;
    const pagination = {
      page: typeof payloadPagination?.page === 'number' ? payloadPagination.page : page,
      limit: typeof payloadPagination?.limit === 'number' ? payloadPagination.limit : limit,
      total: typeof payloadPagination?.total === 'number' ? payloadPagination.total : normalizedItems.length,
      totalPages: typeof payloadPagination?.totalPages === 'number' ? payloadPagination.totalPages : 1
    };

    return {items: normalizedItems, pagination};
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Etkinlikler alınamadı.'));
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

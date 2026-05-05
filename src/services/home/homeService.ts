import {buildApiUrl} from '@/services/api/apiConfig';

type ServiceErrorResponse = {
  messageId?: string;
  userDescription?: string;
  subErrors?: unknown;
  message?: string;
};

type HomeHost = {
  id?: string;
  name?: string;
  avatar?: string | null;
};

type HomeLocation = {
  addressText?: string;
  lat?: number;
  lng?: number;
};

export type HomeEvent = {
  id: string;
  title: string;
  coverPhoto?: string;
  startsAt?: string;
  acceptedCount?: number;
  distanceKm?: number;
  host?: HomeHost;
  location?: HomeLocation;
};

export type HomeInterestGroup = {
  interest: {
    id: string;
    name: string;
  };
  events: HomeEvent[];
};

export type HomeFeed = {
  featuredEvents: HomeEvent[];
  upcomingEvents: HomeEvent[];
  groupedEvents: HomeInterestGroup[];
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

  return 'Anasayfa verileri alınamadı.';
};

const normalizeEvent = (item: unknown): HomeEvent | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const raw = item as {
    id?: unknown;
    title?: unknown;
    coverPhoto?: unknown;
    startsAt?: unknown;
    acceptedCount?: unknown;
    distanceKm?: unknown;
    host?: unknown;
    location?: unknown;
  };

  const id = typeof raw.id === 'string' ? raw.id : raw.id != null ? String(raw.id) : '';
  const title = typeof raw.title === 'string' ? raw.title : raw.title != null ? String(raw.title) : '';

  if (!id || !title.trim()) {
    return null;
  }

  const hostRaw = raw.host && typeof raw.host === 'object' ? (raw.host as HomeHost) : undefined;
  const locationRaw = raw.location && typeof raw.location === 'object' ? (raw.location as HomeLocation) : undefined;

  return {
    id,
    title: title.trim(),
    coverPhoto: typeof raw.coverPhoto === 'string' ? raw.coverPhoto : undefined,
    startsAt: typeof raw.startsAt === 'string' ? raw.startsAt : undefined,
    acceptedCount: typeof raw.acceptedCount === 'number' ? raw.acceptedCount : undefined,
    distanceKm: typeof raw.distanceKm === 'number' ? raw.distanceKm : undefined,
    host: hostRaw,
    location: locationRaw
  };
};

const normalizeGroups = (value: unknown): HomeInterestGroup[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const raw = item as {interest?: unknown; events?: unknown};
      if (!raw.interest || typeof raw.interest !== 'object') {
        return null;
      }

      const interestRaw = raw.interest as {id?: unknown; name?: unknown};
      const id =
        typeof interestRaw.id === 'string'
          ? interestRaw.id
          : interestRaw.id != null
            ? String(interestRaw.id)
            : '';
      const name =
        typeof interestRaw.name === 'string'
          ? interestRaw.name
          : interestRaw.name != null
            ? String(interestRaw.name)
            : '';

      if (!id || !name.trim()) {
        return null;
      }

      const events = Array.isArray(raw.events)
        ? raw.events.map(normalizeEvent).filter((event): event is HomeEvent => event !== null)
        : [];

      return {
        interest: {id, name: name.trim()},
        events
      };
    })
    .filter((item): item is HomeInterestGroup => item !== null);
};

export const getHomeFeed = async ({
  lat,
  lng,
  accessToken
}: {
  lat: number;
  lng: number;
  accessToken?: string;
}): Promise<HomeFeed> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng)
  });

  const response = await fetch(buildApiUrl(`/v1/home?${params.toString()}`), {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    featuredEvents?: unknown;
    upcomingEvents?: unknown;
    groupedEvents?: unknown;
  };

  return {
    featuredEvents: Array.isArray(payload.featuredEvents)
      ? payload.featuredEvents.map(normalizeEvent).filter((event): event is HomeEvent => event !== null)
      : [],
    upcomingEvents: Array.isArray(payload.upcomingEvents)
      ? payload.upcomingEvents.map(normalizeEvent).filter((event): event is HomeEvent => event !== null)
      : [],
    groupedEvents: normalizeGroups(payload.groupedEvents)
  };
};

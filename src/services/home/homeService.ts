import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

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

  try {
    const response = await networkClient.get('/v1/home', {
      headers,
      params: {lat: String(lat), lng: String(lng)}
    });

    const payload = response.data as {
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
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Anasayfa verileri alınamadı.'));
  }
};

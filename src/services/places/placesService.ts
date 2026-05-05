import {buildApiUrl} from '@/services/api/apiConfig';

type ServiceErrorResponse = {
  userDescription?: string;
  message?: string;
};

export type PlaceSearchItem = {
  id: string;
  title: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
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

  return 'Konum araması yapılamadı.';
};

const normalizePlace = (value: unknown): PlaceSearchItem | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as {
    id?: unknown;
    placeId?: unknown;
    title?: unknown;
    name?: unknown;
    addressText?: unknown;
    fullAddress?: unknown;
    address?: unknown;
    latitude?: unknown;
    lat?: unknown;
    longitude?: unknown;
    lng?: unknown;
    lon?: unknown;
  };

  const latitudeCandidate =
    typeof raw.latitude === 'number'
      ? raw.latitude
      : typeof raw.lat === 'number'
        ? raw.lat
        : typeof raw.latitude === 'string'
          ? Number(raw.latitude)
          : typeof raw.lat === 'string'
            ? Number(raw.lat)
            : NaN;

  const longitudeCandidate =
    typeof raw.longitude === 'number'
      ? raw.longitude
      : typeof raw.lng === 'number'
        ? raw.lng
        : typeof raw.lon === 'number'
          ? raw.lon
          : typeof raw.longitude === 'string'
            ? Number(raw.longitude)
            : typeof raw.lng === 'string'
              ? Number(raw.lng)
              : typeof raw.lon === 'string'
                ? Number(raw.lon)
                : NaN;

  if (!Number.isFinite(latitudeCandidate) || !Number.isFinite(longitudeCandidate)) {
    return null;
  }

  const idRaw = raw.id ?? raw.placeId;
  const titleRaw = raw.title ?? raw.name;
  const addressRaw = raw.fullAddress ?? raw.addressText ?? raw.address;

  const id = typeof idRaw === 'string' ? idRaw : idRaw != null ? String(idRaw) : '';
  const title = typeof titleRaw === 'string' ? titleRaw : titleRaw != null ? String(titleRaw) : '';
  const fullAddress = typeof addressRaw === 'string' ? addressRaw : addressRaw != null ? String(addressRaw) : title;

  if (!title.trim() || !fullAddress.trim()) {
    return null;
  }

  return {
    id: id || `${latitudeCandidate}:${longitudeCandidate}`,
    title: title.trim(),
    fullAddress: fullAddress.trim(),
    latitude: latitudeCandidate,
    longitude: longitudeCandidate
  };
};

export const searchPlaces = async ({
  query,
  accessToken
}: {
  query: string;
  accessToken?: string;
}): Promise<PlaceSearchItem[]> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const params = new URLSearchParams({query: query.trim()});
  const response = await fetch(buildApiUrl(`/v1/places/search?${params.toString()}`), {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as {items?: unknown; data?: unknown} | unknown[];
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray((data as {items?: unknown})?.items)
      ? ((data as {items: unknown[]}).items ?? [])
      : Array.isArray((data as {data?: unknown})?.data)
        ? ((data as {data: unknown[]}).data ?? [])
        : [];

  return rawItems.map(normalizePlace).filter((item): item is PlaceSearchItem => item !== null);
};

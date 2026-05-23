import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';
import {AxiosRequestConfig} from 'axios';

export type PlaceSearchItem = {
  id: string;
  title: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
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
  accessToken,
  lat,
  lng,
  limit = 8,
  signal
}: {
  query: string;
  accessToken?: string;
  lat?: number;
  lng?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<PlaceSearchItem[]> => {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const params: Record<string, string | number> = {
    q: query.trim(),
    limit
  };

  if (typeof lat === 'number') {
    params.lat = lat;
  }

  if (typeof lng === 'number') {
    params.lng = lng;
  }

  try {
    const config: AxiosRequestConfig = {
      headers,
      params,
      signal
    };

    const response = await networkClient.get('/v1/places/search', config);

    const data = response.data as {items?: unknown; data?: unknown} | unknown[];
    const rawItems = Array.isArray(data)
      ? data
      : Array.isArray((data as {items?: unknown})?.items)
        ? ((data as {items: unknown[]}).items ?? [])
        : Array.isArray((data as {data?: unknown})?.data)
          ? ((data as {data: unknown[]}).data ?? [])
          : [];

    return rawItems.map(normalizePlace).filter((item): item is PlaceSearchItem => item !== null);
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Konum araması yapılamadı.'));
  }
};

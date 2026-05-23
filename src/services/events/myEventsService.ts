import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

export type MyEventsType = 'active' | 'past';

export type MyEventItem = {
  id: string;
  image: string;
  date: string;
  title: string;
  location: string;
};

export type MyEventsResponse = {
  items: MyEventItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const formatStartsAt = (startsAt?: string) => {
  if (!startsAt) {
    return 'TARİH BELİRTİLMEDİ';
  }

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return 'TARİH BELİRTİLMEDİ';
  }

  return date
    .toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
    .replace(',', ' •')
    .toUpperCase();
};

export const getMyEvents = async ({
  accessToken,
  type,
  page = 1,
  limit = 20
}: {
  accessToken?: string;
  type: MyEventsType;
  page?: number;
  limit?: number;
}): Promise<MyEventsResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.get('/v1/events/me', {
      headers,
      params: {
        type,
        page,
        limit
      }
    });

    const payload = response.data as {
      items?: Array<{
        id?: unknown;
        title?: unknown;
        startsAt?: unknown;
        location?: {addressText?: unknown} | null;
        coverPhotos?: Array<{url?: unknown}>;
      }>;
      pagination?: {
        page?: unknown;
        limit?: unknown;
        total?: unknown;
        totalPages?: unknown;
      };
    };

    const items = Array.isArray(payload.items)
      ? payload.items
          .map(item => {
            const id = typeof item.id === 'string' ? item.id : item.id != null ? String(item.id) : '';
            const title = typeof item.title === 'string' ? item.title : '';
            if (!id || !title.trim()) {
              return null;
            }

            const image =
              Array.isArray(item.coverPhotos) && typeof item.coverPhotos[0]?.url === 'string' ? item.coverPhotos[0].url : '';

            const location = typeof item.location?.addressText === 'string' ? item.location.addressText : 'Konum bilgisi yok';

            return {
              id,
              image,
              date: formatStartsAt(typeof item.startsAt === 'string' ? item.startsAt : undefined),
              title: title.trim(),
              location
            } as MyEventItem;
          })
          .filter((item): item is MyEventItem => item !== null)
      : [];

    const pagination = {
      page: typeof payload.pagination?.page === 'number' ? payload.pagination.page : page,
      limit: typeof payload.pagination?.limit === 'number' ? payload.pagination.limit : limit,
      total: typeof payload.pagination?.total === 'number' ? payload.pagination.total : items.length,
      totalPages: typeof payload.pagination?.totalPages === 'number' ? payload.pagination.totalPages : 1
    };

    return {items, pagination};
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Etkinlikler getirilemedi.'));
  }
};

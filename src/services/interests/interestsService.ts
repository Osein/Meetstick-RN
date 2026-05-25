import {Interest} from '@/types';
import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

const normalizeInterest = (item: unknown): Interest | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const raw = item as {id?: unknown; name?: unknown; title?: unknown; isFavorite?: unknown};
  const id =
    typeof raw.id === 'string' || typeof raw.id === 'number'
      ? raw.id
      : raw.id != null
        ? String(raw.id)
        : '';

  const title =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.title === 'string'
        ? raw.title
        : raw.name != null
          ? String(raw.name)
          : raw.title != null
            ? String(raw.title)
            : '';

  if (!id || !title.trim()) {
    return null;
  }

  return {
    id,
    title: title.trim(),
    isFavorite: raw.isFavorite === true
  };
};

export const getInterests = async (): Promise<Interest[]> => {
  try {
    const response = await networkClient.get('/v1/interests');
    const payload = response.data as unknown;
    const rawList = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as {interests?: unknown[]}).interests)
        ? (payload as {interests: unknown[]}).interests
        : payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown[]}).data)
          ? (payload as {data: unknown[]}).data
          : [];

    return rawList.map(normalizeInterest).filter((item): item is Interest => item !== null);
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'İlgi alanları alınamadı.'));
  }
};

export const setInterestFavorite = async ({
  interestId,
  isFavorite
}: {
  interestId: string | number;
  isFavorite: boolean;
}): Promise<void> => {
  try {
    await networkClient.post('/v1/interests/favorite', {
      interestId: String(interestId),
      isFavorite
    });
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Favori durumu güncellenemedi.'));
  }
};

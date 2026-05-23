import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';
import {optimizeImagesUnder1MB} from '@/services/media/imageOptimizationService';

type PhotosOperation = {
  removeIndexes: number[];
  inserts: Array<{targetIndex: number; fileIndex: number}>;
};

type UpdateAuthPhotosParams = {
  accessToken?: string;
  initialPhotos: string[];
  nextPhotos: string[];
};

type AuthPhotoApiItem = {
  index?: unknown;
  url?: unknown;
  photoUrl?: unknown;
};

const inferMimeType = (uri: string): string => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const countMap = (items: string[]): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach(item => map.set(item, (map.get(item) || 0) + 1));
  return map;
};

const isExistingUri = (uri: string, available: Map<string, number>) => {
  const remaining = available.get(uri) || 0;
  if (remaining <= 0) {
    return false;
  }
  available.set(uri, remaining - 1);
  return true;
};

const buildOperations = (initialPhotos: string[], nextPhotos: string[]) => {
  const remaining = countMap(initialPhotos);
  const finalExisting: string[] = [];
  const newUris: string[] = [];

  nextPhotos.forEach(uri => {
    if (isExistingUri(uri, remaining)) {
      finalExisting.push(uri);
      return;
    }
    newUris.push(uri);
  });

  const keepCounts = countMap(finalExisting);
  const consumeKeep = new Map(keepCounts);
  const removeIndexes: number[] = [];

  initialPhotos.forEach((uri, index) => {
    const left = consumeKeep.get(uri) || 0;
    if (left > 0) {
      consumeKeep.set(uri, left - 1);
    } else {
      removeIndexes.push(index);
    }
  });

  const inserts: Array<{targetIndex: number; fileIndex: number}> = [];
  let fileIndex = 0;
  const keepCounter = countMap(initialPhotos);

  nextPhotos.forEach((uri, targetIndex) => {
    const left = keepCounter.get(uri) || 0;
    if (left > 0) {
      keepCounter.set(uri, left - 1);
      return;
    }

    inserts.push({targetIndex, fileIndex});
    fileIndex += 1;
  });

  const operations: PhotosOperation = {
    removeIndexes,
    inserts
  };

  return {operations, newUris};
};

export const updateAuthPhotos = async ({
  accessToken,
  initialPhotos,
  nextPhotos
}: UpdateAuthPhotosParams): Promise<string[]> => {
  const sanitizedInitial = initialPhotos.filter(uri => uri.trim().length > 0);
  const sanitizedNext = nextPhotos.filter(uri => uri.trim().length > 0).slice(0, 9);

  const {operations, newUris} = buildOperations(sanitizedInitial, sanitizedNext);
  const optimizedNewUris = await optimizeImagesUnder1MB(newUris);

  const formData = new FormData();
  formData.append('operations', JSON.stringify(operations));

  optimizedNewUris.forEach((uri, index) => {
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    formData.append('photos', {
      uri,
      name: `profile-photo-${index + 1}.${extension}`,
      type: inferMimeType(uri)
    } as unknown as Blob);
  });

  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.put('/v1/auth/photos', formData, {headers});
    const payload = response.data as {photos?: unknown} | null;

    const normalized = Array.isArray(payload?.photos)
      ? payload!.photos
          .map(item => {
            const raw = item as AuthPhotoApiItem;
            const index = typeof raw.index === 'number' ? raw.index : NaN;
            const url =
              typeof raw.url === 'string'
                ? raw.url
                : typeof raw.photoUrl === 'string'
                  ? raw.photoUrl
                  : '';

            if (!Number.isFinite(index) || !url) {
              return null;
            }

            return {index, url};
          })
          .filter((item): item is {index: number; url: string} => item !== null)
          .sort((a, b) => a.index - b.index)
      : [];

    return normalized.map(item => item.url);
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Profil fotoğrafları güncellenemedi.'));
  }
};

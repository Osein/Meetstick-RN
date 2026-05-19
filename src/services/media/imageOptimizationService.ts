import * as LegacyFileSystem from 'expo-file-system/legacy';
import {SaveFormat, manipulateAsync} from 'expo-image-manipulator';

const ONE_MB_IN_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;
const MIN_QUALITY = 0.45;
const MAX_ATTEMPTS = 7;

const getFileSize = async (uri: string): Promise<number> => {
  const info = await LegacyFileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return Number.MAX_SAFE_INTEGER;
  }

  return typeof info.size === 'number' ? info.size : Number.MAX_SAFE_INTEGER;
};

export const optimizeImageUnder1MB = async (uri: string): Promise<string> => {
  // First pass: normalize image format and capture dimensions.
  const normalized = await manipulateAsync(uri, [], {
    compress: 1,
    format: SaveFormat.JPEG
  });

  // Hard constraint from backend: image dimensions must be <= 1024x1024.
  const longestSide = Math.max(normalized.width, normalized.height);
  const currentUriAfterSizeLimit =
    longestSide > MAX_DIMENSION
      ? (
          await manipulateAsync(
            normalized.uri,
            normalized.width >= normalized.height
              ? [{resize: {width: MAX_DIMENSION}}]
              : [{resize: {height: MAX_DIMENSION}}],
            {
              compress: 0.8,
              format: SaveFormat.JPEG
            }
          )
        ).uri
      : normalized.uri;

  let currentUri = currentUriAfterSizeLimit;
  let currentSize = await getFileSize(currentUri);

  if (currentSize <= ONE_MB_IN_BYTES) {
    return currentUri;
  }

  let width: number | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const compressionStep = 0.12 * attempt;
    const quality = Math.max(MIN_QUALITY, 0.9 - compressionStep);
    const knownWidth = width ?? 0;
    const shouldResize = attempt >= 2 && knownWidth > 720;
    const nextWidth = shouldResize ? Math.max(720, Math.floor(knownWidth * 0.88)) : undefined;
    const actions = nextWidth ? [{resize: {width: nextWidth}}] : [];

    const result = await manipulateAsync(currentUri, actions, {
      compress: quality,
      format: SaveFormat.JPEG
    });

    currentUri = result.uri;
    width = result.width;
    currentSize = await getFileSize(currentUri);

    if (currentSize <= ONE_MB_IN_BYTES) {
      return currentUri;
    }
  }

  return currentUri;
};

export const optimizeImagesUnder1MB = async (uris: string[]): Promise<string[]> => {
  const optimized: string[] = [];

  for (const uri of uris) {
    optimized.push(await optimizeImageUnder1MB(uri));
  }

  return optimized;
};

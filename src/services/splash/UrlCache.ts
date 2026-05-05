import * as FileSystem from 'expo-file-system/legacy';

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']);
const cacheDirectory = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}onboarding-images/` : null;

const isRemoteUrl = (url: string) => /^https?:\/\//i.test(url);

const getExtensionFromUrl = (url: string): string => {
  const sanitized = url.split('?')[0];
  const segments = sanitized.split('/');
  const lastSegment = segments[segments.length - 1] || '';
  const dotMatch = lastSegment.match(/\.([a-z0-9]+)$/i);
  const ext = dotMatch?.[1] ?? (imageExtensions.has(lastSegment.toLowerCase()) ? lastSegment : '');
  return imageExtensions.has(ext.toLowerCase()) ? `.${ext.toLowerCase()}` : '.img';
};

const hashUrl = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

export class UrlCache {
  private static cacheReady: Promise<string | null> | null = null;
  private static pendingDownloads = new Map<string, Promise<string>>();

  private async ensureCacheDir(): Promise<string | null> {
    if (!cacheDirectory) {
      return null;
    }

    if (!UrlCache.cacheReady) {
      UrlCache.cacheReady = FileSystem.makeDirectoryAsync(cacheDirectory, {intermediates: true})
        .then(() => cacheDirectory)
        .catch(() => cacheDirectory);
    }

    return UrlCache.cacheReady;
  }

  private async resolveFileUri(url: string): Promise<string | null> {
    const directory = await this.ensureCacheDir();
    if (!directory) {
      return null;
    }

    const fileName = `${hashUrl(url)}${getExtensionFromUrl(url)}`;
    return `${directory}${fileName}`;
  }

  async getCachedFileUri(url: string): Promise<string | null> {
    if (!isRemoteUrl(url)) {
      return url;
    }

    const fileUri = await this.resolveFileUri(url);
    if (!fileUri) {
      return url;
    }

    const info = await FileSystem.getInfoAsync(fileUri);
    return info.exists ? info.uri : null;
  }

  async getOrDownload(url: string): Promise<string> {
    if (!isRemoteUrl(url)) {
      return url;
    }

    const fileUri = await this.resolveFileUri(url);
    if (!fileUri) {
      return url;
    }

    const cached = await FileSystem.getInfoAsync(fileUri);
    if (cached.exists) {
      return cached.uri;
    }

    const existingDownload = UrlCache.pendingDownloads.get(fileUri);
    if (existingDownload) {
      return existingDownload;
    }

    const downloadPromise = FileSystem.downloadAsync(url, fileUri)
      .then(result => result.uri)
      .catch(() => url)
      .finally(() => {
        UrlCache.pendingDownloads.delete(fileUri);
      });

    UrlCache.pendingDownloads.set(fileUri, downloadPromise);
    return downloadPromise;
  }
}

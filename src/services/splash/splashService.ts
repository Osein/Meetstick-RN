import {AppConfigContainer, OnboardingImageKey} from '@/config/AppConfigContainer';
import {buildApiUrl} from '@/services/api/apiConfig';
import {UrlCache} from '@/services/splash/UrlCache';

type SplashConfigResponse = {
  onboardingImages?: unknown;
};

const isSvgUrl = (url: string): boolean => {
  if (url.startsWith('data:image/svg+xml')) {
    return true;
  }

  const sanitized = url.split('?')[0];
  return sanitized.toLowerCase().endsWith('.svg');
};

const normalizeOnboardingImages = (value: unknown): Array<string | null> | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.map(item => (typeof item === 'string' && item.trim().length > 0 ? item.trim() : null));
};

export class SplashService {
  private static cachedOnboardingImages: Partial<Record<OnboardingImageKey, string>> = {};
  private static pendingOnboardingImages: Promise<Array<string | null> | null> | null = null;
  private configContainer: AppConfigContainer;
  private urlCache: UrlCache;

  constructor(
    configContainer: AppConfigContainer = AppConfigContainer.getInstance(),
    urlCache: UrlCache = new UrlCache()
  ) {
    this.configContainer = configContainer;
    this.urlCache = urlCache;
  }

  private async fetchRemoteOnboardingImages(): Promise<Array<string | null> | null> {
    if (SplashService.pendingOnboardingImages) {
      return SplashService.pendingOnboardingImages;
    }

    const request = fetch(buildApiUrl('/v1/home/splash-config'))
      .then(async response => {
        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as SplashConfigResponse;
        return normalizeOnboardingImages(data.onboardingImages);
      })
      .catch(() => null)
      .finally(() => {
        SplashService.pendingOnboardingImages = null;
      });

    SplashService.pendingOnboardingImages = request;
    return request;
  }

  async fetchOnboardingImageUrls(keys: OnboardingImageKey[]): Promise<string[]> {
    const hasAllCached = keys.every(key => Boolean(SplashService.cachedOnboardingImages[key]));
    if (hasAllCached) {
      return keys.map(key => SplashService.cachedOnboardingImages[key] ?? this.configContainer.getFallbackImageUrl());
    }

    const remoteImages = await this.fetchRemoteOnboardingImages();
    const urls = keys.map((key, index) => {
      const remoteUrl = remoteImages?.[index];
      if (remoteUrl) {
        return remoteUrl;
      }

      return this.configContainer.getOnboardingImageUrl(key);
    });
    const cachedUrls = await Promise.all(
      urls.map(url => (isSvgUrl(url) ? Promise.resolve(url) : this.urlCache.getOrDownload(url)))
    );
    keys.forEach((key, index) => {
      SplashService.cachedOnboardingImages[key] = cachedUrls[index];
    });
    return cachedUrls;
  }
}

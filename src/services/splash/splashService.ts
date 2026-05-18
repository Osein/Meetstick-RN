import {AppConfigContainer, OnboardingImageKey} from '@/config/AppConfigContainer';
import {VerifyOtpResponse} from '@/services/auth/authService';
import {networkClient} from '@/services/network/networkClient';
import {UrlCache} from '@/services/splash/UrlCache';
import {Gender, LegalAgreement} from '@/types';

type SplashConfigResponse = {
  onboardingImages?: unknown;
  agreements?: unknown;
  user?: unknown;
};

type SplashAgreement = {
  id: string;
  key: string;
  version: string;
  title: string;
  required?: boolean;
};

type StartupPayload = {
  onboardingImageUrls: string[];
  legalAgreements: LegalAgreement[];
  userProfile?: VerifyOtpResponse;
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

const normalizeGender = (value: unknown): Gender | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toUpperCase();
  if (normalized === 'MALE') return 'MALE';
  if (normalized === 'FEMALE') return 'FEMALE';
  if (normalized === 'OTHER') return 'OTHER';
  return undefined;
};

const normalizeAgreement = (value: unknown): SplashAgreement | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Partial<SplashAgreement>;
  const id = typeof data.id === 'string' ? data.id : '';
  const key = typeof data.key === 'string' ? data.key : '';
  const version =
    typeof data.version === 'string'
      ? data.version
      : data.version != null
        ? String(data.version)
        : '';
  const title = typeof data.title === 'string' ? data.title : '';

  if (!id || !key || !version || !title) {
    return null;
  }

  return {
    id,
    key,
    version,
    title,
    required: Boolean(data.required)
  };
};

const normalizeUserProfile = (value: unknown, accessToken?: string): VerifyOtpResponse | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const user = value as {
    id?: unknown;
    name?: unknown;
    phoneNumber?: unknown;
    birthDate?: unknown;
    gender?: unknown;
    nearbyEventsRadiusKm?: unknown;
    photos?: unknown;
  };

  const photos = Array.isArray(user.photos)
    ? user.photos
        .map((photo, index) => {
          if (!photo || typeof photo !== 'object') {
            return null;
          }
          const typedPhoto = photo as {id?: unknown; photoUrl?: unknown; url?: unknown};
          const photoUrl =
            typeof typedPhoto.photoUrl === 'string'
              ? typedPhoto.photoUrl
              : typeof typedPhoto.url === 'string'
                ? typedPhoto.url
                : null;

          if (!photoUrl) {
            return null;
          }

          return {
            id: typeof typedPhoto.id === 'string' ? typedPhoto.id : `photo-${index}`,
            photoUrl
          };
        })
        .filter((photo): photo is {id: string; photoUrl: string} => photo !== null)
    : [];

  return {
    id: typeof user.id === 'string' ? user.id : undefined,
    name: typeof user.name === 'string' ? user.name : undefined,
    phoneNumber: typeof user.phoneNumber === 'string' ? user.phoneNumber : undefined,
    birthDate: typeof user.birthDate === 'string' ? user.birthDate : undefined,
    gender: normalizeGender(user.gender),
    locationDistance:
      typeof user.nearbyEventsRadiusKm === 'number' ? user.nearbyEventsRadiusKm : undefined,
    accessToken,
    interests: [],
    photos
  };
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

    const request = networkClient
      .get('/v1/home/splash-config')
      .then(response => {
        const data = response.data as SplashConfigResponse;
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

  private async fetchAgreementHtml(id: string, accessToken?: string): Promise<string | null> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await networkClient.get(`/v1/agreements/${encodeURIComponent(id)}/html-content`, {
        headers
      });
      const payload = response.data as {content?: unknown};
      if (typeof payload.content === 'string' && payload.content.trim().length > 0) {
        return payload.content;
      }

      return null;
    } catch {
      return null;
    }
  }

  async fetchStartupPayload(params: {
    onboardingKeys: OnboardingImageKey[];
    accessToken?: string;
  }): Promise<StartupPayload> {
    const {onboardingKeys, accessToken} = params;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const onboardingImageUrlsPromise = this.fetchOnboardingImageUrls(onboardingKeys);

    let splashPayload: SplashConfigResponse = {};
    try {
      const response = await networkClient.get('/v1/auth/splash', {headers});
      splashPayload = response.data as SplashConfigResponse;
    } catch {
      splashPayload = {};
    }

    const onboardingImageUrls = await onboardingImageUrlsPromise;
    const normalizedAgreements = Array.isArray(splashPayload.agreements)
      ? splashPayload.agreements
          .map(normalizeAgreement)
          .filter((agreement): agreement is SplashAgreement => agreement !== null)
      : [];

    const legalAgreementsWithHtml = await Promise.all(
      normalizedAgreements.map(async agreement => {
        const htmlContent = await this.fetchAgreementHtml(agreement.id, accessToken);
        if (!htmlContent) {
          return null;
        }

        return {
          id: agreement.id,
          key: agreement.key,
          version: agreement.version,
          title: agreement.title,
          htmlContent,
          required: agreement.required
        } as LegalAgreement;
      })
    );

    return {
      onboardingImageUrls,
      legalAgreements: legalAgreementsWithHtml.filter(
        (agreement): agreement is LegalAgreement => agreement !== null
      ),
      userProfile: normalizeUserProfile(splashPayload.user, accessToken)
    };
  }
}

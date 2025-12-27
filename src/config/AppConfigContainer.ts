import {Image} from 'react-native';
import pixelPng from '../../assets/images/pixel.png';

export type OnboardingImageKey = 'discover' | 'communities' | 'match';

type AppConfig = {
  onboardingImages: Partial<Record<OnboardingImageKey, string>>;
  fallbackImageUrl: string;
};

const pixelImageUri = Image.resolveAssetSource(pixelPng)?.uri;
const fallbackImageUrl =
  pixelImageUri || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=';

const defaultAppConfig: AppConfig = {
  onboardingImages: {
    discover: 'https://placehold.co/600x600/png?text=Meetstick+1',
    communities: 'https://placehold.co/600x600/png?text=Meetstick+2',
    match: 'https://placehold.co/600x600/png?text=Meetstick+3'
  },
  fallbackImageUrl
};

export class AppConfigContainer {
  private static instance: AppConfigContainer | null = null;
  private config: AppConfig;

  private constructor(config: AppConfig) {
    this.config = config;
  }

  static getInstance(): AppConfigContainer {
    if (!AppConfigContainer.instance) {
      AppConfigContainer.instance = new AppConfigContainer(defaultAppConfig);
    }

    return AppConfigContainer.instance;
  }

  getFallbackImageUrl(): string {
    return this.config.fallbackImageUrl;
  }

  getOnboardingImageUrl(key: OnboardingImageKey): string {
    const url = this.config.onboardingImages[key];
    return url && url.trim().length > 0 ? url : this.config.fallbackImageUrl;
  }

  getOnboardingImageUrls(keys: OnboardingImageKey[]): string[] {
    return keys.map(key => this.getOnboardingImageUrl(key));
  }
}

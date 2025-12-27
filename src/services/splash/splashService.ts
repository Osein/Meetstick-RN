import {AppConfigContainer, OnboardingImageKey} from '@/config/AppConfigContainer';

const mockDelayMs = 200;

export class SplashService {
  private configContainer: AppConfigContainer;

  constructor(configContainer: AppConfigContainer = AppConfigContainer.getInstance()) {
    this.configContainer = configContainer;
  }

  async fetchOnboardingImageUrls(keys: OnboardingImageKey[]): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, mockDelayMs));
    return this.configContainer.getOnboardingImageUrls(keys);
  }
}

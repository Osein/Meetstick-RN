import type {VerifyOtpResponse, UserProfilePhoto} from '@/services/auth/authService';
import type {Gender} from '@/types';

type AuthUserPayload = {
  id?: unknown;
  name?: unknown;
  phoneNumber?: unknown;
  birthDate?: unknown;
  gender?: unknown;
  nearbyEventsRadiusKm?: unknown;
  photos?: Array<{id?: unknown; photoUrl?: unknown; url?: unknown}> | unknown;
};

type AuthResponsePayload = {
  valid?: unknown;
  userExists?: unknown;
  registrationToken?: unknown;
  accessToken?: unknown;
  refreshToken?: unknown;
  user?: AuthUserPayload | null;
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

const normalizePhotos = (value: AuthUserPayload['photos']): UserProfilePhoto[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((photo, index) => {
      const photoUrl =
        typeof photo?.photoUrl === 'string'
          ? photo.photoUrl
          : typeof photo?.url === 'string'
            ? photo.url
            : null;

      if (!photoUrl) {
        return null;
      }

      return {
        id: typeof photo?.id === 'string' ? photo.id : `photo-${index}`,
        photoUrl
      } as UserProfilePhoto;
    })
    .filter((photo): photo is UserProfilePhoto => photo !== null);
};

export const mapAuthResponseToVerifyOtpResponse = (data: AuthResponsePayload): VerifyOtpResponse => {
  return {
    id: typeof data.user?.id === 'string' ? data.user.id : undefined,
    name: typeof data.user?.name === 'string' ? data.user.name : undefined,
    phoneNumber: typeof data.user?.phoneNumber === 'string' ? data.user.phoneNumber : undefined,
    birthDate: typeof data.user?.birthDate === 'string' ? data.user.birthDate : undefined,
    gender: normalizeGender(data.user?.gender),
    locationDistance: typeof data.user?.nearbyEventsRadiusKm === 'number' ? data.user.nearbyEventsRadiusKm : undefined,
    accessToken: typeof data.accessToken === 'string' ? data.accessToken : undefined,
    refreshToken: typeof data.refreshToken === 'string' ? data.refreshToken : undefined,
    photos: normalizePhotos(data.user?.photos),
    interests: [],
    userExists: data.userExists === true,
    registrationToken: typeof data.registrationToken === 'string' ? data.registrationToken : undefined
  };
};

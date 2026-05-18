import {Gender, Interest} from '@/types';
import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

type LoginWithPhoneRequest = {
  phoneNumber: string;
};

type LoginWithPhoneResponse = {
  otpId: string;
  phoneNumber?: string;
  otpEndTime: number;
};

type StartLoginApiResponse = {
  otpId?: string;
  phoneNumber?: string;
  expiresAt?: string;
};

export type UserProfilePhoto = {
  id: string;
  photoUrl: string;
};

export type VerifyOtpResponse = {
  id?: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  locationDistance?: number;
  birthDate?: string;
  gender?: Gender;
  level?: number;
  accessToken?: string;
  interests?: Interest[];
  photos?: UserProfilePhoto[];
  userExists?: boolean;
  registrationToken?: string;
};

type VerifyOtpRequest = {
  otpId: string;
  otpCode: string;
};

type ResendOtpRequest = {
  otpId: string;
};

export type DeleteAccountReason = 'not_satisfied' | 'delete_my_data' | 'other';

type RequestDeleteAccountOtpResponse = {
  otpId: string;
  phoneNumber?: string;
  otpEndTime: number;
};

type ConfirmDeleteAccountRequest = {
  otpId: string;
  otpCode: string;
  reason: DeleteAccountReason;
  reasonNote?: string;
  accessToken?: string;
};

type ResendDeleteAccountOtpRequest = {
  otpId: string;
  accessToken?: string;
};

type RequestDeleteAccountOtpApiResponse = {
  otpId?: string;
  phoneNumber?: string;
  expiresAt?: string;
};

export const loginWithPhoneNumber = async (
  payload: LoginWithPhoneRequest
): Promise<LoginWithPhoneResponse> => {
  const normalizedPhoneNumber = payload.phoneNumber.replace(/\s+/g, '').trim();

  try {
    const response = await networkClient.post('/v1/auth/send-sms-otp', {
      phoneNumber: normalizedPhoneNumber
    });
    const data = response.data as StartLoginApiResponse;
    const parsedExpiresAt = data?.expiresAt ? Date.parse(data.expiresAt) : NaN;

    if (!Number.isFinite(parsedExpiresAt) || typeof data?.otpId !== 'string' || data.otpId.trim().length === 0) {
      throw new Error('Sunucudan geçersiz yanıt alındı.');
    }

    return {
      otpId: data.otpId,
      phoneNumber: data.phoneNumber,
      otpEndTime: parsedExpiresAt
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Sunucudan geçersiz yanıt alındı.'
        ? error.message
        : getServiceErrorMessage(error);
    throw new Error(message);
  }
};

export const verifyLoginOtp = async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  const normalizedOtpId = payload.otpId.trim();
  const normalizedOtpCode = payload.otpCode.replace(/\s+/g, '').trim();

  try {
    const response = await networkClient.post('/v1/auth/verify-sms-otp', {
      otpId: normalizedOtpId,
      code: normalizedOtpCode
    });
    const data = response.data as {
    valid?: boolean;
    userExists?: boolean;
    registrationToken?: string | null;
    accessToken?: string | null;
    user?: {
      id?: string;
      name?: string;
      phoneNumber?: string;
      birthDate?: string;
      gender?: Gender;
      nearbyEventsRadiusKm?: number;
      photos?: Array<{id?: string; photoUrl?: string; url?: string}>;
      interestIds?: string[];
    } | null;
  };

    if (data?.valid !== true) {
      throw new Error('Doğrulama kodu geçersiz.');
    }

    const userPhotos: UserProfilePhoto[] = Array.isArray(data.user?.photos)
      ? data.user!.photos
          .map((photo, index) => {
            const photoUrl = typeof photo?.photoUrl === 'string'
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
            };
          })
          .filter((photo): photo is UserProfilePhoto => photo !== null)
      : [];

    return {
      id: data.user?.id,
      name: data.user?.name,
      phoneNumber: data.user?.phoneNumber,
      birthDate: data.user?.birthDate,
      gender: data.user?.gender,
      locationDistance: data.user?.nearbyEventsRadiusKm,
      accessToken: data.accessToken ?? undefined,
      photos: userPhotos,
      interests: [],
      userExists: data.userExists === true,
      registrationToken: typeof data.registrationToken === 'string' ? data.registrationToken : undefined
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Doğrulama kodu geçersiz.'
        ? error.message
        : getServiceErrorMessage(error);
    throw new Error(message);
  }
};

export const resendLoginOtp = async (payload: ResendOtpRequest): Promise<LoginWithPhoneResponse> => {
  const normalizedOtpId = payload.otpId.trim();

  try {
    const response = await networkClient.post('/v1/auth/resend-sms-otp', {
      otpId: normalizedOtpId
    });
    const data = response.data as StartLoginApiResponse;
    const parsedExpiresAt = data?.expiresAt ? Date.parse(data.expiresAt) : NaN;

    if (!Number.isFinite(parsedExpiresAt) || typeof data?.otpId !== 'string' || data.otpId.trim().length === 0) {
      throw new Error('Sunucudan geçersiz yanıt alındı.');
    }

    return {
      otpId: data.otpId,
      phoneNumber: data.phoneNumber,
      otpEndTime: parsedExpiresAt
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Sunucudan geçersiz yanıt alındı.'
        ? error.message
        : getServiceErrorMessage(error);
    throw new Error(message);
  }
};

export const requestDeleteAccountOtp = async (
  accessToken?: string
): Promise<RequestDeleteAccountOtpResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.post('/v1/auth/delete-account/request-otp', undefined, {headers});
    const data = response.data as RequestDeleteAccountOtpApiResponse;
    const parsedExpiresAt = data?.expiresAt ? Date.parse(data.expiresAt) : NaN;

    if (!Number.isFinite(parsedExpiresAt) || typeof data?.otpId !== 'string' || data.otpId.trim().length === 0) {
      throw new Error('Sunucudan geçersiz yanıt alındı.');
    }

    return {
      otpId: data.otpId,
      phoneNumber: data.phoneNumber,
      otpEndTime: parsedExpiresAt
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Sunucudan geçersiz yanıt alındı.'
        ? error.message
        : getServiceErrorMessage(error);
    throw new Error(message);
  }
};

export const confirmDeleteAccount = async (payload: ConfirmDeleteAccountRequest): Promise<void> => {
  const normalizedOtpId = payload.otpId.trim();
  const normalizedOtpCode = payload.otpCode.replace(/\s+/g, '').trim();
  const normalizedReasonNote = payload.reasonNote?.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (payload.accessToken) {
    headers.Authorization = `Bearer ${payload.accessToken}`;
  }

  try {
    await networkClient.post(
      '/v1/auth/delete-account/confirm',
      {
        otpId: normalizedOtpId,
        code: normalizedOtpCode,
        reason: payload.reason,
        reasonNote: normalizedReasonNote && normalizedReasonNote.length > 0 ? normalizedReasonNote : undefined
      },
      {headers}
    );
  } catch (error) {
    throw new Error(getServiceErrorMessage(error));
  }
};

export const resendDeleteAccountOtp = async (
  payload: ResendDeleteAccountOtpRequest
): Promise<RequestDeleteAccountOtpResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (payload.accessToken) {
    headers.Authorization = `Bearer ${payload.accessToken}`;
  }

  try {
    const response = await networkClient.post(
      '/v1/auth/delete-account/resend-otp',
      {
        otpId: payload.otpId.trim()
      },
      {headers}
    );
    const data = response.data as RequestDeleteAccountOtpApiResponse;
    const parsedExpiresAt = data?.expiresAt ? Date.parse(data.expiresAt) : NaN;

    if (!Number.isFinite(parsedExpiresAt) || typeof data?.otpId !== 'string' || data.otpId.trim().length === 0) {
      throw new Error('Sunucudan geçersiz yanıt alındı.');
    }

    return {
      otpId: data.otpId,
      phoneNumber: data.phoneNumber,
      otpEndTime: parsedExpiresAt
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Sunucudan geçersiz yanıt alındı.'
        ? error.message
        : getServiceErrorMessage(error);
    throw new Error(message);
  }
};

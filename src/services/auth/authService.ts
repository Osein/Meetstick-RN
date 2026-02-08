import {buildApiUrl} from '@/services/api/apiConfig';

type LoginWithPhoneRequest = {
  phoneNumber: string;
};

type LoginWithPhoneResponse = {
  otpEndTime: number;
};

type ServiceErrorResponse = {
  messageId?: string;
  userDescription?: string;
  subErrors?: unknown;
  message?: string;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ServiceErrorResponse;
    if (typeof data.userDescription === 'string' && data.userDescription.trim().length > 0) {
      return data.userDescription;
    }

    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // noop
  }

  return 'İstek başarısız oldu.';
};

export const loginWithPhoneNumber = async (
  payload: LoginWithPhoneRequest
): Promise<LoginWithPhoneResponse> => {
  const normalizedPhoneNumber = payload.phoneNumber.replace(/\s+/g, '').trim();

  const response = await fetch(buildApiUrl('/v1/user/login/phone-number'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: normalizedPhoneNumber
    })
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as LoginWithPhoneResponse;

  if (!Number.isFinite(data?.otpEndTime)) {
    throw new Error('Sunucudan geçersiz yanıt alındı.');
  }

  return data;
};

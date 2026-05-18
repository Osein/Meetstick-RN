import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

type UpdateLocationDistancePayload = {
  locationDistance: number;
  accessToken?: string;
};

export const updateLocationDistance = async ({
  locationDistance,
  accessToken
}: UpdateLocationDistancePayload): Promise<void> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    await networkClient.post(
      '/v1/auth/settings/nearby-events-radius',
      {radiusKm: locationDistance},
      {headers}
    );
  } catch (error) {
    throw new Error(getServiceErrorMessage(error));
  }
};

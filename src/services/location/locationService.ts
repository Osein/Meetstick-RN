import * as Location from 'expo-location';

export type AppLocationCoords = {
  lat: number;
  lng: number;
};

export const checkForegroundLocationPermission = async (): Promise<boolean> => {
  const current = await Location.getForegroundPermissionsAsync();
  return current.granted;
};

export const requestForegroundLocationPermission = async (): Promise<boolean> => {
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.granted;
};

export const getForegroundLocationPermission = async (): Promise<boolean> => {
  const hasPermission = await checkForegroundLocationPermission();
  if (hasPermission) {
    return true;
  }

  return requestForegroundLocationPermission();
};

export const getCurrentLocationCoords = async (): Promise<AppLocationCoords> => {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    return {
      lat: lastKnown.coords.latitude,
      lng: lastKnown.coords.longitude
    };
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced
  });

  return {
    lat: current.coords.latitude,
    lng: current.coords.longitude
  };
};

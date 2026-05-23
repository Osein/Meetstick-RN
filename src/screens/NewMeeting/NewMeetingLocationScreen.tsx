import React, {useEffect, useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MapView, {MapPressEvent, Marker, Region} from 'react-native-maps';
import {Ionicons} from '@expo/vector-icons';
import * as Location from 'expo-location';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
type Props = NativeStackScreenProps<RootStackParamList, 'NewMeetingLocation'>;

type SelectedLocation = {
  latitude: number;
  longitude: number;
  addressText: string;
  placeId?: string;
};

const ISTANBUL_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08
};

const USER_FOCUS_REGION_DELTA = {
  latitudeDelta: 0.012,
  longitudeDelta: 0.012
};

const formatReverseGeocodedAddress = (result?: Location.LocationGeocodedAddress | null) => {
  if (!result) {
    return '';
  }

  return [
    result.name,
    result.street,
    result.district,
    result.city,
    result.region,
    result.country
  ]
    .filter(value => typeof value === 'string' && value.trim().length > 0)
    .join(', ');
};

export const NewMeetingLocationScreen: React.FC<Props> = ({navigation, route}) => {
  const {state, updateMeetingDraft} = useAppContext();
  const {t} = useTranslation();

  const initialRegion = useMemo<Region>(() => {
    if (
      typeof state.newMeetingDraft.latitude === 'number' &&
      typeof state.newMeetingDraft.longitude === 'number'
    ) {
      return {
        latitude: state.newMeetingDraft.latitude,
        longitude: state.newMeetingDraft.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      };
    }

    return ISTANBUL_REGION;
  }, [state.newMeetingDraft.latitude, state.newMeetingDraft.longitude]);

  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
    state.newMeetingDraft.latitude && state.newMeetingDraft.longitude && state.newMeetingDraft.locationAddress
      ? {
          latitude: state.newMeetingDraft.latitude,
          longitude: state.newMeetingDraft.longitude,
          addressText: state.newMeetingDraft.locationAddress,
          placeId: state.newMeetingDraft.locationPlaceId
        }
      : null
  );
  const [region, setRegion] = useState<Region>(initialRegion);

  useEffect(() => {
    let active = true;

    const focusUserLocation = async () => {
      try {
        const existingPermission = await Location.getForegroundPermissionsAsync();
        const permission =
          existingPermission.status === 'granted'
            ? existingPermission
            : await Location.requestForegroundPermissionsAsync();

        if (!active || permission.status !== 'granted') {
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        if (!active) {
          return;
        }

        setRegion({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
          ...USER_FOCUS_REGION_DELTA
        });
      } catch {
        // Keep Istanbul fallback when device location is unavailable.
      }
    };

    if (!selectedLocation) {
      focusUserLocation();
    }

    return () => {
      active = false;
    };
  }, [selectedLocation]);

  useEffect(() => {
    const focusedPlace = route.params?.focusedPlace;
    if (!focusedPlace) {
      return;
    }

    setRegion({
      latitude: focusedPlace.lat,
      longitude: focusedPlace.lng,
      latitudeDelta: USER_FOCUS_REGION_DELTA.latitudeDelta,
      longitudeDelta: USER_FOCUS_REGION_DELTA.longitudeDelta
    });
    setSelectedLocation({
      latitude: focusedPlace.lat,
      longitude: focusedPlace.lng,
      addressText: focusedPlace.address,
      placeId: focusedPlace.placeId
    });

    navigation.setParams({focusedPlace: undefined});
  }, [navigation, route.params?.focusedPlace]);

  const onMapPress = async (event: MapPressEvent) => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    setIsResolvingAddress(true);
    setSelectedLocation({
      latitude,
      longitude,
      addressText: ''
    });

    try {
      const [result] = await Location.reverseGeocodeAsync({latitude, longitude});
      const addressText = formatReverseGeocodedAddress(result);

      setSelectedLocation({
        latitude,
        longitude,
        addressText,
      });
    } catch {
      setSelectedLocation({
        latitude,
        longitude,
        addressText: ''
      });
      Alert.alert(t('newMeeting.location.addressNotFound'), t('newMeeting.location.addressNotFoundDescription'));
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const applyLocation = () => {
    if (!selectedLocation) {
      return;
    }

    updateMeetingDraft({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationAddress: selectedLocation.addressText,
      locationPlaceId: selectedLocation.placeId
    });

    navigation.goBack();
  };

  return (
    <Screen background="#fff" style={styles.screen}>
      <AppHeader
        title={t('newMeeting.location.title')}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('NewMeetingLocationSearch', {
                lat: region.latitude,
                lng: region.longitude
              })
            }
            style={styles.searchButton}
          >
            <Ionicons name="search" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={onMapPress}
          showsUserLocation
          showsMyLocationButton
        >
          {selectedLocation ? (
            <Marker coordinate={{latitude: selectedLocation.latitude, longitude: selectedLocation.longitude}} />
          ) : null}
        </MapView>

        {selectedLocation ? (
          <View style={styles.locationOverlay}>
            {isResolvingAddress ? (
              <View style={styles.locationLoadingRow}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.locationLoadingText}>{t('newMeeting.location.resolving')}</Text>
              </View>
            ) : (
              <Text style={styles.locationOverlayText} numberOfLines={2}>
                {selectedLocation.addressText || t('newMeeting.location.addressNotFound')}
              </Text>
            )}
            <PrimaryButton
              label={t('newMeeting.location.useCta')}
              onPress={applyLocation}
              disabled={isResolvingAddress || !selectedLocation.addressText}
              loading={isResolvingAddress}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0
  },
  searchButton: {
    padding: 4
  },
  mapWrap: {
    flex: 1,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  locationOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 6
  },
  locationOverlayText: {
    color: palette.textSecondary,
    marginBottom: 10
  },
  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  locationLoadingText: {
    color: palette.textSecondary
  }
});

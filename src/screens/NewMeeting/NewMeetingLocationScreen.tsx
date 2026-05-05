import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View} from 'react-native';
import MapView, {MapPressEvent, Marker, Region} from 'react-native-maps';
import {Ionicons} from '@expo/vector-icons';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {PlaceSearchItem, searchPlaces} from '@/services/places/placesService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

export const NewMeetingLocationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft} = useAppContext();

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

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [places, setPlaces] = useState<PlaceSearchItem[]>([]);
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

  const onMapPress = (event: MapPressEvent) => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude,
      addressText: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    });
  };

  const onSearch = async () => {
    if (query.trim().length < 2) {
      setPlaces([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchPlaces({query, accessToken: state.user?.accessToken});
      setPlaces(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Konum araması sırasında bir hata oluştu.';
      Alert.alert('Konum Arama', message);
    } finally {
      setIsSearching(false);
    }
  };

  const onPlaceSelect = (item: PlaceSearchItem) => {
    const nextRegion: Region = {
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02
    };

    setRegion(nextRegion);
    setSelectedLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      addressText: item.fullAddress,
      placeId: item.id
    });
    setPlaces([]);
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
    <Screen background="#fff">
      <AppHeader
        title="Konum seç"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={() => setIsSearchVisible(prev => !prev)} style={{padding: 4}}>
            <Ionicons name="search" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
        }
      />

      {isSearchVisible ? (
        <View style={{paddingHorizontal: 16, paddingTop: 12, gap: 10}}>
          <View style={{flexDirection: 'row', gap: 8}}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Konum ara"
              onSubmitEditing={onSearch}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15
              }}
            />
            <TouchableOpacity
              onPress={onSearch}
              style={{paddingHorizontal: 14, borderRadius: 10, backgroundColor: palette.primary, justifyContent: 'center'}}
            >
              {isSearching ? <ActivityIndicator color="#fff" /> : <Text style={{color: '#fff', fontWeight: '600'}}>Ara</Text>}
            </TouchableOpacity>
          </View>

          {places.length > 0 ? (
            <View style={{maxHeight: 180, borderWidth: 1, borderColor: palette.border, borderRadius: 10}}>
              <FlatList
                data={places}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={() => onPlaceSelect(item)}
                    style={{paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.border}}
                  >
                    <Text style={{fontWeight: '600', color: palette.textPrimary}}>{item.title}</Text>
                    <Text style={{color: palette.textSecondary, marginTop: 2}} numberOfLines={2}>
                      {item.fullAddress}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{flex: 1, padding: 16, paddingTop: isSearchVisible ? 12 : 16}}>
        <MapView style={{flex: 1, borderRadius: 14}} initialRegion={initialRegion} region={region} onRegionChangeComplete={setRegion} onPress={onMapPress}>
          {selectedLocation ? (
            <Marker
              coordinate={{latitude: selectedLocation.latitude, longitude: selectedLocation.longitude}}
              title="Seçilen konum"
              description={selectedLocation.addressText}
            />
          ) : null}
        </MapView>
      </View>

      {selectedLocation ? (
        <View style={{padding: 16, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: '#fff'}}>
          <Text style={{color: palette.textSecondary, marginBottom: 10}} numberOfLines={2}>
            {selectedLocation.addressText}
          </Text>
          <PrimaryButton label="Seçtiğim konumu kullan" onPress={applyLocation} />
        </View>
      ) : null}
    </Screen>
  );
};

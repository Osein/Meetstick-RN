import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Alert, Image, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {createEvent} from '@/services/events/eventsService';
import {bumpRefreshKey} from '@/services/refresh/refreshStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const NewMeetingPhotosScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft, resetMeetingDraft} = useAppContext();
  const [photos, setPhotos] = useState(state.newMeetingDraft.photos);
  const [loading, setLoading] = useState(false);

  const isDraftValid = useMemo(() => {
    const draft = state.newMeetingDraft;
    const baseValid =
      draft.title.trim().length > 3 &&
      draft.participantCount.trim().length > 0 &&
      draft.description.trim().length > 10 &&
      !!draft.locationAddress &&
      typeof draft.latitude === 'number' &&
      typeof draft.longitude === 'number';

    if (!baseValid) {
      return false;
    }

    if (!draft.isFutureEvent) {
      return true;
    }

    if (!draft.startDateTime || !draft.endDateTime) {
      return false;
    }

    const start = new Date(draft.startDateTime).getTime();
    const end = new Date(draft.endDateTime).getTime();
    return start > Date.now() && end > start;
  }, [state.newMeetingDraft]);

  const addRandomPhoto = () => {
    const seed = Math.floor(Math.random() * 1000);
    setPhotos(prev => [...prev, `https://picsum.photos/seed/meeting-${seed}/400/400`].slice(0, 9));
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const finish = async () => {
    if (!isDraftValid) {
      Alert.alert('Eksik Bilgi', 'Lütfen önce etkinlik detaylarını ve konumu tamamla.');
      navigation.navigate('NewMeetingDetails');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Fotoğraf Gerekli', 'Etkinliği oluşturmak için en az bir fotoğraf ekle.');
      return;
    }

    const participantCount = Number(state.newMeetingDraft.participantCount);
    if (!Number.isFinite(participantCount) || participantCount <= 0) {
      Alert.alert('Katılımcı Sayısı', 'Katılımcı sayısını geçerli bir sayı olarak gir.');
      navigation.navigate('NewMeetingDetails');
      return;
    }

    setLoading(true);
    updateMeetingDraft({photos});

    try {
      await createEvent({
        accessToken: state.user?.accessToken,
        payload: {
          title: state.newMeetingDraft.title.trim(),
          description: state.newMeetingDraft.description.trim(),
          participantCount,
          isFutureEvent: state.newMeetingDraft.isFutureEvent,
          eventDateTime: state.newMeetingDraft.isFutureEvent ? state.newMeetingDraft.startDateTime : undefined,
          location: {
            addressText: state.newMeetingDraft.locationAddress!,
            latitude: state.newMeetingDraft.latitude!,
            longitude: state.newMeetingDraft.longitude!,
            placeId: state.newMeetingDraft.locationPlaceId
          },
          photos
        }
      });

      resetMeetingDraft();
      bumpRefreshKey('home');
      bumpRefreshKey('profile');
      Alert.alert('Oluşturuldu', 'Etkinlik başarıyla oluşturuldu.');
      navigation.navigate('MainTabs');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Etkinlik oluşturulamadı.';
      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Fotoğraflar" onBack={() => navigation.goBack()} />
      <View style={{padding: 16, gap: 12, flex: 1}}>
        <Text style={{color: palette.textSecondary}}>
          En fazla 9 fotoğraf ekleyebilirsin. Kartlar, katılımcıların fikir edinmesini sağlar.
        </Text>
        <ScrollView contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap', gap: 12}}>
          {photos.map((uri, index) => (
            <TouchableOpacity key={uri} onPress={() => removePhoto(index)}>
              <Image source={{uri}} style={{width: 100, height: 100, borderRadius: 12, backgroundColor: palette.border}} />
              <Text style={{textAlign: 'center', color: palette.textSecondary, marginTop: 4}}>Kaldır</Text>
            </TouchableOpacity>
          ))}
          {photos.length < 9 ? (
            <TouchableOpacity
              onPress={addRandomPhoto}
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{color: palette.textSecondary}}>Foto ekle</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
        <View style={{flex: 1}} />
        <OutlinedButton label="Geri" onPress={() => navigation.goBack()} />
        <PrimaryButton label="Etkinliği oluştur" onPress={finish} disabled={loading} loading={loading} />
      </View>
    </Screen>
  );
};

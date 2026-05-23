import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Text, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {ProfilePhotosGridNine} from '@/components/ProfilePhotosGridNine';
import {bumpRefreshKey} from '@/services/refresh/refreshStore';
import {updateAuthPhotos} from '@/services/auth/authPhotosService';
import {showErrorToast, showSuccessToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfilePhotos'>;

export const EditProfilePhotosScreen: React.FC<Props> = ({navigation}) => {
  const {state, setAuthenticatedUser} = useAppContext();
  const user = state.user;
  const initialPhotos = user?.photos || [];
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(() => photos.length >= 3 && photos.length <= 9 && !isSaving, [photos.length, isSaving]);

  const handleSave = async () => {
    if (!user) {
      navigation.goBack();
      return;
    }

    try {
      setIsSaving(true);
      const updatedPhotos = await updateAuthPhotos({
        accessToken: user.accessToken,
        initialPhotos,
        nextPhotos: photos
      });

      setAuthenticatedUser({...user, photos: updatedPhotos});
      bumpRefreshKey('profile');
      showSuccessToast('Profil fotoğrafları güncellendi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profil fotoğrafları güncellenemedi.';
      showErrorToast(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Profil Fotoğrafları" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, paddingHorizontal: 16, paddingTop: 16}}>
        <Text style={{fontSize: 16, lineHeight: 22, color: palette.textSecondary}}>
          Fotoğraflarını ekleyebilir, kaldırabilir ve sürükleyerek sıralayabilirsin.
        </Text>
        <Text style={{marginTop: 6, fontSize: 13, lineHeight: 18, color: palette.muted}}>En az 3, en fazla 9 fotoğraf.</Text>

        <View style={{marginTop: 18}}>
          <ProfilePhotosGridNine photos={photos} onChangePhotos={setPhotos} />
        </View>

        <View style={{flex: 1}} />
        <View style={{marginBottom: 16}}>
          <PrimaryButton label="Kaydet" onPress={handleSave} disabled={!canSave} loading={isSaving} />
        </View>
      </View>
    </Screen>
  );
};

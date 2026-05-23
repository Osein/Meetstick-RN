import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {View, Text} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {registerUser} from '@/services/auth/authService';
import {showErrorToast} from '@/services/ui/toastService';
import {ProfilePhotosGridNine} from '@/components/ProfilePhotosGridNine';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterPhotos'>;
const MIN_REQUIRED_PHOTOS = 3;

export const RegisterPhotosScreen: React.FC<Props> = ({navigation, route}) => {
  const {registrationToken} = route.params;
  const {state, updateRegisterDraft, completeRegistration, completeLoginWithVerifiedProfile} = useAppContext();
  const [photos, setPhotos] = useState<string[]>(state.registerDraft.photos);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canFinish = useMemo(() => photos.length >= MIN_REQUIRED_PHOTOS && !isSubmitting, [photos.length, isSubmitting]);

  const handleFinish = async () => {
    if (!canFinish) {
      return;
    }

    const draft = {
      ...state.registerDraft,
      photos
    };

    try {
      setIsSubmitting(true);
      updateRegisterDraft({photos});
      const response = await registerUser({
        registrationToken,
        name: draft.name,
        birthDate: draft.birthDate,
        gender: draft.gender,
        bio: draft.bio,
        agreementIds: state.legalAgreements.map(item => item.id),
        interestIds: draft.interests.map(item => item.id),
        photos: draft.photos
      });

      if (response.accessToken) {
        await completeLoginWithVerifiedProfile(response);
      } else {
        completeRegistration({photos});
      }

      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs'}]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayıt tamamlanamadı. Lütfen tekrar dene.';
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Kayıt Ol" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, paddingHorizontal: 16, paddingTop: 16}}>
        <Text style={{fontSize: 24, lineHeight: 24, fontWeight: '700', color: palette.textPrimary}}>
          Kendini göster:
        </Text>
        <Text style={{fontSize: 16, lineHeight: 20, color: palette.textSecondary, marginTop: 4}}>
          En az 3 tane ilgi çekici fotoğrafını ekleyerek etkinliklere katılma şansını arttırabilirsin.
        </Text>

        <View style={{marginTop: 18}}>
          <ProfilePhotosGridNine photos={photos} onChangePhotos={setPhotos} />
        </View>

        <View style={{flex: 1}} />
        <View style={{marginBottom: 16}}>
          <PrimaryButton label="Kullanmaya Başla" onPress={handleFinish} disabled={!canFinish} loading={isSubmitting} />
        </View>
      </View>
    </Screen>
  );
};

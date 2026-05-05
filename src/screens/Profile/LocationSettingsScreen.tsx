import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Text, View} from 'react-native';
import Slider from '@react-native-community/slider';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {PrimaryButton} from '@/components/Buttons';
import {useAppContext} from '@/context/AppContext';
import {updateLocationDistance as updateLocationDistanceService} from '@/services/user/userService';
import {showErrorToast, showSuccessToast} from '@/services/ui/toastService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const LocationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateLocationDistance} = useAppContext();
  const [distance, setDistance] = React.useState(state.user?.locationDistance ?? 25);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setDistance(state.user?.locationDistance ?? 25);
  }, [state.user?.locationDistance]);

  const handleSave = async () => {
    const previousDistance = state.user?.locationDistance ?? 25;

    try {
      setIsSaving(true);
      await updateLocationDistanceService({
        locationDistance: distance,
        accessToken: state.user?.accessToken
      });
      await updateLocationDistance(distance);
      showSuccessToast('Konum ayarlarınız başarıyla güncellendi');
    } catch (error) {
      setDistance(previousDistance);
      const message =
        error instanceof Error ? error.message : 'Konum mesafesi güncellenemedi. Lütfen tekrar dene.';
      showErrorToast(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Konum Ayarları" onBack={() => navigation.goBack()} />
      <View
        style={{
          margin: 16,
          padding: 16,
          backgroundColor: palette.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.border,
          gap: 12
        }}
      >
        <Text style={{fontSize: 16, color: palette.textSecondary}}>
          Yakın çevrende göstermek istediğin etkinlik mesafesini belirle.
        </Text>
        <Slider
          value={distance}
          minimumValue={10}
          maximumValue={150}
          step={1}
          minimumTrackTintColor={palette.primary}
          maximumTrackTintColor={palette.border}
          thumbTintColor={palette.primary}
          onValueChange={setDistance}
        />
        <Text style={{textAlign: 'right', fontSize: 32, fontWeight: '700', color: palette.textPrimary}}>
          {distance} km
        </Text>
        <PrimaryButton
          label="Kaydet"
          onPress={handleSave}
          disabled={isSaving}
          loading={isSaving}
        />
      </View>
    </Screen>
  );
};

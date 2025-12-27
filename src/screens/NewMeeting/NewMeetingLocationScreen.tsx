import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Text, TextInput, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const NewMeetingLocationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft} = useAppContext();
  const [address, setAddress] = useState(state.newMeetingDraft.locationAddress || '');

  const canContinue = useMemo(() => address.trim().length > 5, [address]);

  const handleNext = () => {
    updateMeetingDraft({
      locationAddress: address,
      latitude: 41.0082,
      longitude: 28.9784
    });
    navigation.navigate('NewMeetingPhotos');
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Konum seç" onBack={() => navigation.goBack()} />
      <View style={{padding: 16, gap: 16, flex: 1}}>
        <Text style={{color: palette.textSecondary}}>
          Harita entegrasyonu olmadan, adres bilgisini burada paylaşabilirsin.
        </Text>
        <View style={{height: 180, borderRadius: 12, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: palette.textSecondary}}>Harita önizlemesi (mock)</Text>
          <Text style={{color: palette.textSecondary}}>41.0082, 28.9784</Text>
        </View>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Adres veya buluşma noktası"
          multiline
          numberOfLines={3}
          style={{
            minHeight: 100,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 12,
            padding: 12,
            textAlignVertical: 'top'
          }}
        />
        <View style={{flex: 1}} />
        <OutlinedButton label="Geri" onPress={() => navigation.goBack()} />
        <PrimaryButton label="Devam" onPress={handleNext} disabled={!canContinue} />
      </View>
    </Screen>
  );
};

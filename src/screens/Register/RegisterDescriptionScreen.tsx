import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Platform, Text, TextInput, View} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterDescription'>;

export const RegisterDescriptionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft} = useAppContext();
  const [bio, setBio] = useState(state.registerDraft.bio || '');

  const canContinue = useMemo(() => bio.trim().length > 10, [bio]);

  const handleContinue = () => {
    updateRegisterDraft({bio});
    navigation.navigate('RegisterInterests');
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Hakkında" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{flex: 1, padding: 20, gap: 16}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={{fontSize: 22, fontWeight: '700', color: palette.textPrimary}}>Kendini tanıt</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Kısaca kendinden bahset"
          multiline
          numberOfLines={6}
          style={{
            minHeight: 160,
            textAlignVertical: 'top',
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 12,
            padding: 12,
            fontSize: 16
          }}
        />
        <View style={{flex: 1}} />
        <PrimaryButton label="Devam" onPress={handleContinue} disabled={!canContinue} />
      </KeyboardAvoidingView>
    </Screen>
  );
};

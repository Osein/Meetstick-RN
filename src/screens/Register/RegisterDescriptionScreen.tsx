import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Platform, Text, TextInput, View} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterDescription'>;
const MIN_BIO_LENGTH = 50;
const MAX_BIO_LENGTH = 1000;

export const RegisterDescriptionScreen: React.FC<Props> = ({navigation, route}) => {
  const {registrationToken} = route.params;
  const {state, updateRegisterDraft} = useAppContext();
  const [bio, setBio] = useState(state.registerDraft.bio || '');
  const bioLength = bio.length;

  const canContinue = useMemo(
    () => bioLength >= MIN_BIO_LENGTH && bioLength <= MAX_BIO_LENGTH,
    [bioLength]
  );

  const handleBioChange = (text: string) => {
    setBio(text);
  };

  const handleContinue = () => {
    updateRegisterDraft({bio});
    navigation.navigate('RegisterInterests', {registrationToken});
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Hakkında" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardDismissView style={{flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 16}}>
          <View>
            <TextInput
              value={bio}
              onChangeText={handleBioChange}
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
            <Text
              style={{
                marginTop: 6,
                textAlign: 'right',
                color: bioLength < MIN_BIO_LENGTH || bioLength > MAX_BIO_LENGTH ? '#FF4D4F' : palette.muted,
                fontSize: 13
              }}
            >
              {bioLength}/{MAX_BIO_LENGTH}
            </Text>
          </View>
          <View style={{flex: 1}} />
          <View style={{marginBottom: 16}}>
            <PrimaryButton label="Devam" onPress={handleContinue} disabled={!canContinue} />
          </View>
        </KeyboardDismissView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

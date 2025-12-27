import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Platform, Text, TextInput, View} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState('');
  const isValid = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone]);

  const handleContinue = () => {
    if (!isValid) {
      return;
    }
    const otpEndTime = Date.now() + 2 * 60 * 1000;
    navigation.navigate('Otp', {phoneNumber: phone, otpEndTime});
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Telefon ile giriş" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{flex: 1, padding: 20, justifyContent: 'space-between'}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <Text style={{fontSize: 24, fontWeight: '700', color: palette.textPrimary, marginBottom: 12}}>
            Telefon numaranı gir
          </Text>
          <Text style={{color: palette.textSecondary, fontSize: 16, lineHeight: 22}}>
            Doğrulama kodu gönderebilmemiz için numarana ihtiyacımız var.
          </Text>

          <View
            style={{
              marginTop: 24,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 4
            }}
          >
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 5xx xxx xx xx"
              keyboardType="phone-pad"
              style={{height: 48, fontSize: 16}}
            />
          </View>

          <Text style={{color: palette.textSecondary, marginTop: 12}}>
            Devam ederek Meetstick kullanım koşullarını ve gizlilik politikasını kabul edersin.
          </Text>
        </View>

        <PrimaryButton label="Devam" onPress={handleContinue} disabled={!isValid} />
      </KeyboardAvoidingView>
    </Screen>
  );
};

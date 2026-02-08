import React, {useEffect, useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Alert, Text, TextInput, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export const OtpScreen: React.FC<Props> = ({navigation, route}) => {
  const {phoneNumber, displayPhoneNumber, otpEndTime} = route.params;
  const {loginWithPhone} = useAppContext();
  const [otp, setOtp] = useState('');
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((otpEndTime - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOtpValid = useMemo(() => otp.trim().length === 6, [otp]);

  const handleVerify = () => {
    if (!isOtpValid) {
      return;
    }
    loginWithPhone(phoneNumber);
    navigation.navigate('Welcome', {registrationToken: 'mock-token'});
  };

  const handleResend = () => {
    Alert.alert('Gönderildi', 'Yeni kod telefonuna gönderildi (mock).');
    setRemaining(120);
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Doğrulama" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, padding: 20, justifyContent: 'space-between'}}>
        <View>
          <Text style={{fontSize: 24, fontWeight: '700', color: palette.textPrimary, marginBottom: 8}}>
            Gelen kodu gir
          </Text>
          <Text style={{color: palette.textSecondary}}>
            {displayPhoneNumber} numarasına 6 haneli kod gönderdik.
          </Text>

          <View
            style={{
              marginTop: 24,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center'
            }}
          >
            <TextInput
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              keyboardType="number-pad"
              style={{
                flex: 1,
                height: 56,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 20,
                letterSpacing: 6,
                textAlign: 'center'
              }}
            />
          </View>

          <Text style={{textAlign: 'center', marginTop: 12, color: palette.textSecondary}}>
            {remaining > 0 ? `Kod tekrar ${remaining}s sonra` : 'Kod ulaşmadı mı?'}
          </Text>

          <OutlinedButton
            label="Kodu yeniden gönder"
            onPress={handleResend}
            disabled={remaining > 0}
            style={{marginTop: 12}}
          />
        </View>

        <PrimaryButton label="Devam et" onPress={handleVerify} disabled={!isOtpValid} />
      </View>
    </Screen>
  );
};

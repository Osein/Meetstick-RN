import React, {useEffect, useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Alert, Pressable, Text, View} from 'react-native';
import {OtpInput} from 'react-native-otp-entry';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
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

  const formattedRemaining = useMemo(() => {
    const minutes = Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [remaining]);

  return (
    <Screen background="#fff">
      <AppHeader title="Doğrulama" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
        <KeyboardDismissView style={{flex: 1, padding: 20, justifyContent: 'space-between'}}>
          <View>
          <Text
            style={{
              color: palette.textSecondary,
              fontSize: 16,
              lineHeight: 24
            }}
          >
            {displayPhoneNumber} numarasına 6 haneli kod gönderdik.
          </Text>

          <OtpInput
            numberOfDigits={6}
            type="numeric"
            autoFocus
            focusColor={palette.primary}
            onTextChange={setOtp}
            onFilled={setOtp}
            theme={{
              containerStyle: {marginTop: 24},
              pinCodeContainerStyle: {
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 12,
                height: 56
              },
              focusedPinCodeContainerStyle: {
                borderColor: palette.primary
              },
              pinCodeTextStyle: {
                fontSize: 20,
                color: palette.textPrimary
              }
            }}
          />

          {remaining > 0 ? (
            <Text
              style={{
                textAlign: 'center',
                marginTop: 24,
                color: palette.textPrimary,
                fontSize: 16,
                lineHeight: 24
              }}
            >
              Doğrulama kodu almadıysanız{'\n'}
              <Text style={{fontWeight: '700'}}>{formattedRemaining}</Text> saniye sonra tekrar isteyebilirsiniz.
            </Text>
          ) : (
            <Text
              style={{
                textAlign: 'center',
                marginTop: 24,
                color: palette.textPrimary,
                fontSize: 16,
                lineHeight: 24
              }}
            >
              Belirtilen süre içerisinde doğrulama{'\n'}kodunu girmediniz.
            </Text>
          )}

          <Pressable onPress={handleResend} disabled={remaining > 0} style={{marginTop: 14}}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
                color: remaining > 0 ? palette.muted : '#FF6B6B'
              }}
            >
              Tekrar Gönder
            </Text>
          </Pressable>
        </View>

          <View style={{marginBottom: 16}}>
            <PrimaryButton label="Devam et" onPress={handleVerify} disabled={!isOtpValid} />
          </View>
        </KeyboardDismissView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

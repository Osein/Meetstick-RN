import React, {useEffect, useMemo, useRef, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Pressable, Text, View} from 'react-native';
import {OtpInput, OtpInputRef} from 'react-native-otp-entry';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {resendLoginOtp, verifyLoginOtp} from '@/services/auth/authService';
import {showErrorToast, showSuccessToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export const OtpScreen: React.FC<Props> = ({navigation, route}) => {
  const {otpId, displayPhoneNumber, otpEndTime} = route.params;
  const {completeLoginWithVerifiedProfile} = useAppContext();
  const otpInputRef = useRef<OtpInputRef>(null);
  const [currentOtpId, setCurrentOtpId] = useState(otpId);
  const [currentDisplayPhoneNumber, setCurrentDisplayPhoneNumber] = useState(displayPhoneNumber);
  const [otp, setOtp] = useState('');
  const [otpInputKey, setOtpInputKey] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
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
  const canContinue = isOtpValid && remaining > 0 && !isVerifying;

  const handleVerify = async () => {
    if (!canContinue) {
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyLoginOtp({
        otpId: currentOtpId,
        otpCode: otp
      });

      if (!response.userExists || !response.accessToken) {
        const registrationToken = response.registrationToken;
        if (!registrationToken) {
          throw new Error('Kullanıcı oturumu oluşturulamadı.');
        }
        navigation.navigate('Welcome', {registrationToken});
        return;
      }

      await completeLoginWithVerifiedProfile(response);
      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs'}]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kod doğrulanamadı. Lütfen tekrar dene.';
      showErrorToast(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (remaining > 0 || isResending) {
      return;
    }

    try {
      setIsResending(true);
      const response = await resendLoginOtp({otpId: currentOtpId});
      const nextRemaining = Math.max(0, Math.floor((response.otpEndTime - Date.now()) / 1000));

      setCurrentOtpId(response.otpId);
      if (response.phoneNumber?.trim()) {
        setCurrentDisplayPhoneNumber(response.phoneNumber.trim());
      }
      otpInputRef.current?.clear();
      otpInputRef.current?.setValue('');
      setOtp('');
      setOtpInputKey(prev => prev + 1);
      setRemaining(nextRemaining);
      showSuccessToast('Yeni doğrulama kodu gönderildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kod tekrar gönderilemedi. Lütfen tekrar dene.';
      showErrorToast(message);
    } finally {
      setIsResending(false);
    }
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
        <KeyboardDismissView
          style={{flex: 1, paddingHorizontal: 20, paddingTop: 20, justifyContent: 'space-between'}}
        >
          <View>
          <Text
            style={{
              color: palette.textSecondary,
              fontSize: 16,
              lineHeight: 24
            }}
          >
            {currentDisplayPhoneNumber} numarasına 6 haneli kod gönderdik.
          </Text>

          <OtpInput
            key={otpInputKey}
            ref={otpInputRef}
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

          <Pressable onPress={handleResend} disabled={remaining > 0 || isResending} style={{marginTop: 14}}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
                color: remaining > 0 || isResending ? palette.muted : '#FF6B6B'
              }}
            >
              Tekrar Gönder
            </Text>
          </Pressable>
        </View>

          <View style={{marginBottom: 16}}>
            <PrimaryButton
              label="Devam et"
              onPress={handleVerify}
              disabled={!canContinue}
              loading={isVerifying}
            />
          </View>
        </KeyboardDismissView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

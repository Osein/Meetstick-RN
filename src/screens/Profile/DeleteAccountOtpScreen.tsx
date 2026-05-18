import React, {useEffect, useMemo, useRef, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Pressable, Text, View} from 'react-native';
import {OtpInput, OtpInputRef} from 'react-native-otp-entry';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {RootStackParamList} from '@/navigation/types';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {confirmDeleteAccount, resendDeleteAccountOtp} from '@/services/auth/authService';
import {showErrorToast, showSuccessToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccountOtp'>;

export const DeleteAccountOtpScreen: React.FC<Props> = ({navigation, route}) => {
  const {otpId, otpEndTime, phoneNumber, reason, reasonNote} = route.params;
  const {state, logout} = useAppContext();

  const otpInputRef = useRef<OtpInputRef>(null);
  const [currentOtpId, setCurrentOtpId] = useState(otpId);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState(phoneNumber);
  const [otp, setOtp] = useState('');
  const [otpInputKey, setOtpInputKey] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((otpEndTime - Date.now()) / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isOtpValid = useMemo(() => otp.trim().length === 6, [otp]);
  const canContinue = isOtpValid && remaining > 0 && !isConfirming;

  const handleConfirm = async () => {
    if (!canContinue) {
      return;
    }

    try {
      setIsConfirming(true);
      await confirmDeleteAccount({
        otpId: currentOtpId,
        otpCode: otp,
        reason,
        reasonNote,
        accessToken: state.user?.accessToken
      });

      showSuccessToast('Hesabın silindi.');
      logout();
      navigation.reset({
        index: 1,
        routes: [{name: 'Onboarding'}, {name: 'Login'}]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hesap silme doğrulaması başarısız oldu.';
      showErrorToast(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    if (remaining > 0 || isResending) {
      return;
    }

    try {
      setIsResending(true);
      const response = await resendDeleteAccountOtp({
        otpId: currentOtpId,
        accessToken: state.user?.accessToken
      });
      const nextRemaining = Math.max(0, Math.floor((response.otpEndTime - Date.now()) / 1000));

      setCurrentOtpId(response.otpId);
      if (response.phoneNumber?.trim()) {
        setCurrentPhoneNumber(response.phoneNumber.trim());
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
      <AppHeader title="Hesabı Sil" onBack={() => navigation.goBack()} />
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
              {currentPhoneNumber || 'Telefon numarana'} numarasına gönderilen 6 haneli kodu girerek hesabını
              silme işlemini onayla.
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
                Yeni kod istemek için{'\n'}
                <Text style={{fontWeight: '700'}}>{formattedRemaining}</Text> bekleyin.
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
                Kodun süresi doldu. Tekrar göndererek devam edebilirsin.
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
              label="Hesabı Sil"
              onPress={handleConfirm}
              disabled={!canContinue}
              loading={isConfirming}
            />
          </View>
        </KeyboardDismissView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

import React, {useEffect, useMemo, useState} from 'react';
import {Platform, Pressable, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {getLocales} from 'expo-localization';
import {AsYouType, CountryCode, parseIncompletePhoneNumber, parsePhoneNumberFromString} from 'libphonenumber-js';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {CountryFlagIcon} from '@/components/CountryFlagIcon';
import {palette} from '@/theme/colors';
import {COUNTRIES, getCountryByCode} from '@/utils/countries';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const FALLBACK_COUNTRY_CODE: CountryCode = 'TR';

const getInitialCountry = () => {
  const localeRegionCode = getLocales()?.[0]?.regionCode?.toUpperCase() as CountryCode | undefined;
  if (localeRegionCode) {
    const localeCountry = getCountryByCode(localeRegionCode);
    if (localeCountry) {
      return localeCountry;
    }
  }

  return getCountryByCode(FALLBACK_COUNTRY_CODE) || COUNTRIES[0];
};

export const LoginScreen: React.FC<Props> = ({navigation, route}) => {
  const [selectedCountry, setSelectedCountry] = useState(getInitialCountry);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');

  useEffect(() => {
    const code = route.params?.selectedCountry;
    if (!code) {
      return;
    }

    const country = getCountryByCode(code);
    if (country && country.code !== selectedCountry.code) {
      setSelectedCountry(country);
    }
  }, [route.params?.selectedCountry, selectedCountry.code]);

  useEffect(() => {
    const formatter = new AsYouType(selectedCountry.code);
    setPhoneInput(formatter.input(phoneDigits));
  }, [selectedCountry.code, phoneDigits]);

  const parsedPhoneNumber = useMemo(
    () => parsePhoneNumberFromString(phoneDigits, selectedCountry.code),
    [phoneDigits, selectedCountry.code]
  );

  const fullPhoneNumber = parsedPhoneNumber?.number;
  const displayPhoneNumber = parsedPhoneNumber?.formatInternational();
  const isValid = Boolean(parsedPhoneNumber?.isValid());

  const handlePhoneChange = (text: string) => {
    const parsed = parseIncompletePhoneNumber(text);
    let nationalInput = parsed;

    if (parsed.startsWith('+')) {
      const withoutPlus = parsed.slice(1);
      if (withoutPlus.startsWith(selectedCountry.callingCode)) {
        nationalInput = withoutPlus.slice(selectedCountry.callingCode.length);
      } else {
        nationalInput = withoutPlus;
      }
    }

    const formatter = new AsYouType(selectedCountry.code);
    const formatted = formatter.input(nationalInput);
    setPhoneDigits(formatter.getNationalNumber());
    setPhoneInput(formatted);
  };

  const handleContinue = () => {
    if (!isValid || !fullPhoneNumber || !displayPhoneNumber) {
      return;
    }
    const otpEndTime = Date.now() + 2 * 60 * 1000;
    navigation.navigate('Otp', {phoneNumber: fullPhoneNumber, displayPhoneNumber, otpEndTime});
  };

  return (
    <Screen background="#fff">
      <AppHeader
        title="Telefon ile giriş"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <KeyboardAvoidingView
        style={{flex: 1, padding: 20, justifyContent: 'space-between'}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <Text style={{color: palette.textSecondary, fontSize: 16, lineHeight: 22}}>
            Doğrulama kodu gönderebilmemiz için numarana ihtiyacımız var.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('CountryPicker')}
            style={{
              marginTop: 24,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 56,
              justifyContent: 'center'
            }}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <CountryFlagIcon code={selectedCountry.code} />
              <Text style={{fontSize: 16, color: palette.textPrimary}}>
                {selectedCountry.name} (+{selectedCountry.callingCode})
              </Text>
            </View>
          </Pressable>

          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              paddingHorizontal: 14
            }}
          >
            <TextInput
              value={phoneInput}
              onChangeText={handlePhoneChange}
              placeholder="Phone number"
              keyboardType="phone-pad"
              style={{height: 48, fontSize: 16}}
            />
          </View>

          <Text style={{color: palette.textSecondary, marginTop: 12}}>
            Devam ederek Meetstick{' '}
            <Text
              style={{textDecorationLine: 'underline'}}
              onPress={() => navigation.navigate('WebView', {title: 'Kullanım Koşulları', url: 'https://google.com'})}
            >
              kullanım koşullarını
            </Text>{' '}
            ve{' '}
            <Text
              style={{textDecorationLine: 'underline'}}
              onPress={() => navigation.navigate('WebView', {title: 'Gizlilik Politikası', url: 'https://google.com'})}
            >
              gizlilik politikasını
            </Text>{' '}
            kabul edersin.
          </Text>
        </View>

        <View style={{marginBottom: 16}}>
          <PrimaryButton label="Devam" onPress={handleContinue} disabled={!isValid} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

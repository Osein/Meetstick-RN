import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from '@react-native-community/datetimepicker';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterInfo'>;

const genders = [
  {value: 'MALE', label: 'Erkek'},
  {value: 'FEMALE', label: 'Kadın'},
  {value: 'OTHER', label: 'Diğer'}
] as const;

const monthsTr = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
] as const;

const monthNameToIndex: Record<string, number> = monthsTr.reduce((acc, month, index) => {
  acc[month.toLocaleLowerCase('tr-TR')] = index;
  return acc;
}, {} as Record<string, number>);

const formatDate = (date: Date): string => {
  const day = date.getUTCDate();
  const month = monthsTr[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
};

const parseDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const dottedParts = value.split('.');
  if (dottedParts.length === 3) {
    const day = Number(dottedParts[0]);
    const month = Number(dottedParts[1]);
    const year = Number(dottedParts[2]);

    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
      return null;
    }

    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  const longMatch = value.match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})$/);
  if (!longMatch) {
    return null;
  }

  const day = Number(longMatch[1]);
  const monthName = longMatch[2].toLocaleLowerCase('tr-TR');
  const year = Number(longMatch[3]);
  const monthIndex = monthNameToIndex[monthName];

  if (!Number.isFinite(day) || !Number.isFinite(year) || monthIndex === undefined) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, monthIndex, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthIndex ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export const RegisterInfoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft} = useAppContext();
  const [name, setName] = useState(state.registerDraft.name);
  const initialDate = parseDate(state.registerDraft.birthDate) || new Date(2000, 0, 1);
  const [birthDate, setBirthDate] = useState(state.registerDraft.birthDate || '');
  const [birthDateValue, setBirthDateValue] = useState(initialDate);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [iosPickerDate, setIosPickerDate] = useState(initialDate);
  const [gender, setGender] = useState(state.registerDraft.gender);
  const [isClosingDatePicker, setIsClosingDatePicker] = useState(false);
  const backdropOpacity = useState(() => new Animated.Value(0))[0];
  const sheetTranslateY = useState(() => new Animated.Value(340))[0];

  const canContinue = useMemo(() => name.trim().length > 2 && birthDate.trim().length > 3, [name, birthDate]);

  const handleContinue = () => {
    updateRegisterDraft({name, birthDate, gender});
    navigation.navigate('RegisterDescription');
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'ios' && selectedDate) {
      setIosPickerDate(selectedDate);
      return;
    }

    if (event.type === 'set' && selectedDate) {
      setBirthDateValue(selectedDate);
      setBirthDate(formatDate(selectedDate));
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: birthDateValue,
        mode: 'date',
        onChange: handleDateChange,
        timeZoneName: 'UTC',
        maximumDate: new Date(),
        minimumDate: new Date(1900, 0, 1)
      });
      return;
    }

    setIosPickerDate(birthDateValue);
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(340);
    setShowIosDatePicker(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const closeIosDatePicker = () => {
    if (isClosingDatePicker) {
      return;
    }
    setIsClosingDatePicker(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 340,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      })
    ]).start(() => {
      setShowIosDatePicker(false);
      setIsClosingDatePicker(false);
    });
  };

  const confirmIosDatePicker = () => {
    setBirthDateValue(iosPickerDate);
    setBirthDate(formatDate(iosPickerDate));
    setShowIosDatePicker(false);
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Kişisel bilgiler" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardDismissView style={{flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 16}}>
          <View style={{gap: 10}}>
            <Text style={{fontWeight: '600', color: palette.textPrimary}}>Ad Soyad</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={inputStyle}
            />
          </View>

          <View style={{gap: 10}}>
            <Text style={{fontWeight: '600', color: palette.textPrimary}}>Doğum Tarihi</Text>
            <TouchableOpacity onPress={openDatePicker} style={[inputStyle, {justifyContent: 'center'}]}>
              <Text style={{color: birthDate ? palette.textPrimary : palette.muted, fontSize: 16}}>
                {birthDate}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{gap: 10}}>
            <Text style={{fontWeight: '600', color: palette.textPrimary}}>Cinsiyetin</Text>
            <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
              {genders.map(item => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setGender(item.value)}
                  style={[
                    {
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: palette.border
                    },
                    gender === item.value && {backgroundColor: palette.primaryLight, borderColor: palette.primary}
                  ]}
                >
                  <Text style={{color: palette.textPrimary, fontWeight: '500'}}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{flex: 1}} />
          <View style={{marginBottom: 16}}>
            <PrimaryButton label="Devam" onPress={handleContinue} disabled={!canContinue} />
          </View>
        </KeyboardDismissView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showIosDatePicker}
          transparent
          animationType="none"
          onRequestClose={closeIosDatePicker}
        >
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <Animated.View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.28)',
                opacity: backdropOpacity
              }}
            />
            <Pressable style={{flex: 1}} onPress={closeIosDatePicker} />
            <Animated.View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                paddingBottom: 24,
                transform: [{translateY: sheetTranslateY}]
              }}
            >
              <View
                style={{
                  width: '100%',
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: palette.border
                }}
              />
              <View
                style={{
                  height: 40,
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                  marginTop: 12
                }}
              >
                <Text
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '600',
                    color: palette.textPrimary
                  }}
                >
                  Doğum Tarihi
                </Text>
                <TouchableOpacity
                  onPress={closeIosDatePicker}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{color: palette.textSecondary, fontSize: 16}}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmIosDatePicker}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{color: palette.primary, fontSize: 16, fontWeight: '600'}}>Seç</Text>
                </TouchableOpacity>
              </View>

              <View style={{alignItems: 'center', paddingTop: 8}}>
                <DateTimePicker
                  value={iosPickerDate}
                  mode="date"
                  display="spinner"
                  timeZoneName="UTC"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={handleDateChange}
                />
              </View>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </Screen>
  );
};

const inputStyle = {
  height: 52,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: palette.border,
  paddingHorizontal: 14,
  fontSize: 16
};

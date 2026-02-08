import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterInfo'>;

const genders = [
  {value: 'MALE', label: 'Erkek'},
  {value: 'FEMALE', label: 'Kadın'},
  {value: 'OTHER', label: 'Diğer'}
] as const;

export const RegisterInfoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft} = useAppContext();
  const [name, setName] = useState(state.registerDraft.name);
  const [birthDate, setBirthDate] = useState(state.registerDraft.birthDate || '');
  const [gender, setGender] = useState(state.registerDraft.gender);

  const canContinue = useMemo(() => name.trim().length > 2 && birthDate.trim().length > 3, [name, birthDate]);

  const handleContinue = () => {
    updateRegisterDraft({name, birthDate, gender});
    navigation.navigate('RegisterDescription');
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Kişisel bilgiler" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{flex: 1, padding: 20, gap: 16}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={{fontSize: 22, fontWeight: '700', color: palette.textPrimary}}>Seni tanıyalım</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Adın Soyadın"
          style={inputStyle}
        />

        <TextInput
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="Doğum tarihi (gg.aa.yyyy)"
          style={inputStyle}
        />

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
        <PrimaryButton label="Devam" onPress={handleContinue} disabled={!canContinue} />
      </KeyboardAvoidingView>
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

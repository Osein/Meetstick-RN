import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {ScrollView, Text, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {Chip} from '@/components/Chip';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {interests as mockInterests} from '@/data/mockData';
import {useAppContext} from '@/context/AppContext';
import {Interest} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterInterests'>;

export const RegisterInterestsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft} = useAppContext();
  const [selected, setSelected] = useState<Interest[]>(state.registerDraft.interests);

  const toggle = (interest: Interest) => {
    setSelected(prev =>
      prev.find(item => item.id === interest.id)
        ? prev.filter(item => item.id !== interest.id)
        : [...prev, interest]
    );
  };

  const canContinue = useMemo(() => selected.length >= 3, [selected]);

  const handleContinue = () => {
    updateRegisterDraft({interests: selected});
    navigation.navigate('RegisterPhotos');
  };

  return (
    <Screen background="#fff">
      <AppHeader title="İlgi alanların" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, padding: 16}}>
        <Text style={{fontSize: 22, fontWeight: '700', color: palette.textPrimary, marginBottom: 12}}>
          Seni anlatan en az 3 ilgi alanı seç
        </Text>
        <ScrollView contentContainerStyle={{gap: 10, flexDirection: 'row', flexWrap: 'wrap'}}>
          {mockInterests.map(item => (
            <Chip
              key={item.id}
              label={item.title}
              selected={!!selected.find(s => s.id === item.id)}
              onPress={() => toggle(item)}
            />
          ))}
        </ScrollView>
        <View style={{flex: 1}} />
        <PrimaryButton label="Devam" onPress={handleContinue} disabled={!canContinue} />
      </View>
    </Screen>
  );
};

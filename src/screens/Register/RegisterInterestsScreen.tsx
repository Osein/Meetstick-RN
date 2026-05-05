import React, {useEffect, useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {ActivityIndicator, ScrollView, Text, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {Chip} from '@/components/Chip';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {Interest} from '@/types';
import {getInterests} from '@/services/interests/interestsService';
import {showErrorToast} from '@/services/ui/toastService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterInterests'>;

export const RegisterInterestsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft} = useAppContext();
  const [interestList, setInterestList] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Interest[]>(state.registerDraft.interests);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchInterests = async () => {
      try {
        setIsLoading(true);
        const response = await getInterests();
        if (!active) {
          return;
        }
        setInterestList(response);
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : 'İlgi alanları alınamadı.';
        showErrorToast(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchInterests();

    return () => {
      active = false;
    };
  }, []);

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
      <View style={{flex: 1, paddingHorizontal: 16, paddingTop: 16}}>
        <Text style={{fontSize: 22, fontWeight: '700', color: palette.textPrimary, marginBottom: 12}}>
          Seni anlatan en az 3 ilgi alanı seç
        </Text>
        {isLoading ? (
          <View style={{paddingTop: 24}}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{gap: 10, flexDirection: 'row', flexWrap: 'wrap'}}>
            {interestList.map(item => (
              <Chip
                key={String(item.id)}
                label={item.title}
                selected={!!selected.find(s => s.id === item.id)}
                onPress={() => toggle(item)}
              />
            ))}
          </ScrollView>
        )}
        <View style={{flex: 1}} />
        <View style={{marginBottom: 16}}>
          <PrimaryButton label="Devam" onPress={handleContinue} disabled={!canContinue} />
        </View>
      </View>
    </Screen>
  );
};

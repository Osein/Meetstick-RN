import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScrollView, Text, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PhotoCarousel} from '@/components/PhotoCarousel';
import {palette} from '@/theme/colors';
import {Person} from '@/types';
import {samplePerson} from '@/data/mockData';
import {Chip} from '@/components/Chip';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

export const PersonDetailScreen: React.FC<Props> = ({navigation}) => {
  const [person, setPerson] = useState<Person | undefined>(undefined);

  useEffect(() => {
    setTimeout(() => setPerson(samplePerson), 300);
  }, []);

  if (!person) {
    return (
      <Screen>
        <AppHeader title="Profil" onBack={() => navigation.goBack()} />
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text>Yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Profil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        <PhotoCarousel photos={person.photos.length ? person.photos : [person.profileImageUrl || '']} height={360} />
        <View style={{padding: 16, gap: 12}}>
          <Text style={{fontSize: 24, fontWeight: '700', color: palette.textPrimary}}>{person.name}</Text>
          {person.gender || person.age ? (
            <Text style={{color: palette.textSecondary}}>
              {[person.gender === 'MALE' ? 'Erkek' : person.gender === 'FEMALE' ? 'Kadın' : 'Diğer', person.age ? `${person.age} yaş` : null]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          ) : null}
          <Text style={{fontWeight: '700', color: palette.textPrimary}}>Hakkında</Text>
          <Text style={{color: palette.textSecondary, lineHeight: 20}}>{person.bio}</Text>
          {person.interests.length ? (
            <View style={{gap: 8}}>
              <Text style={{fontWeight: '700', color: palette.textPrimary}}>İlgi alanları</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                {person.interests.map(item => (
                  <Chip key={item.id} label={item.title} selected />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
};

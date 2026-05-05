import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {Interest} from '@/types';
import {Chip} from '@/components/Chip';
import {useAppContext} from '@/context/AppContext';
import {getUserProfileById, UserProfileDetail} from '@/services/users/usersService';
import {showErrorToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;
const screenWidth = Dimensions.get('window').width;
const imageWidth = screenWidth - 32;

export const PersonDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const {state} = useAppContext();
  const [person, setPerson] = useState<UserProfileDetail | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      try {
        const response = await getUserProfileById({
          userId: route.params.personId,
          accessToken: state.user?.accessToken
        });
        if (!active) {
          return;
        }
        setPerson(response);
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Kullanıcı bilgisi alınamadı.';
        showErrorToast(message);
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, [route.params.personId, state.user?.accessToken]);

  const onCarouselScrollEnd = (eventNative: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(eventNative.nativeEvent.contentOffset.x / imageWidth);
    setActiveIndex(nextIndex);
  };

  const genderLabel =
    person?.gender === 'male' ? 'Erkek' : person?.gender === 'female' ? 'Kadın' : person?.gender === 'other' ? 'Diğer' : null;

  if (!person) {
    return (
      <Screen background="#E9E9EA">
        <AppHeader title="Profil" onBack={() => navigation.goBack()} />
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: palette.textSecondary}}>Yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen background="#E9E9EA">
      <AppHeader title="Profil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        <View style={{paddingHorizontal: 16, paddingTop: 12}}>
          {person.photos.length <= 1 ? (
            <View style={{height: 300, overflow: 'hidden', backgroundColor: '#D8D8D8'}}>
              {person.photos[0] ? (
                <Image source={{uri: person.photos[0]}} style={{width: '100%', height: '100%'}} resizeMode="cover" />
              ) : null}
            </View>
          ) : (
            <View>
              <FlatList
                horizontal
                pagingEnabled
                data={person.photos}
                keyExtractor={(item, index) => `${item}-${index}`}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onCarouselScrollEnd}
                renderItem={({item}) => (
                  <View style={{width: imageWidth, height: 300, overflow: 'hidden', backgroundColor: '#D8D8D8'}}>
                    <Image source={{uri: item}} style={{width: '100%', height: '100%'}} resizeMode="cover" />
                  </View>
                )}
              />
              <View
                style={{position: 'absolute', left: 0, right: 0, bottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8}}
              >
                {person.photos.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: index === activeIndex ? '#FF4E8A' : 'rgba(255,255,255,0.9)'
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={{paddingTop: 14, gap: 14}}>
            <Text style={{fontSize: 41 / 2, fontWeight: '700', color: '#343434'}}>{person.name}</Text>
            {person.isApproved ? <Text style={{fontSize: 32 / 2, color: '#E54979'}}>✓ Onaylı Üye</Text> : null}

            {genderLabel || person.age ? (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Ionicons name="person-circle-outline" size={24} color="#2E2E2E" />
                <Text style={{fontSize: 16, color: '#3C3C3C'}}>
                  {[genderLabel, person.age ? `${person.age} yaşında` : null].filter(Boolean).join(' • ')}
                </Text>
              </View>
            ) : null}

            <View style={{height: 1, backgroundColor: '#C9C9C9'}} />

            <Text style={{fontSize: 17, fontWeight: '700', color: '#393939'}}>Hakkımda:</Text>
            <Text style={{fontSize: 16, lineHeight: 42 / 2, color: '#3B3B3B'}}>
              {person.about || 'Kullanıcı henüz bir açıklama eklememiş.'}
            </Text>

            <View style={{height: 1, backgroundColor: '#C9C9C9'}} />

            <Text style={{fontSize: 17, fontWeight: '700', color: '#393939'}}>İlgi Alanlarım:</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
              {(person.interests.length ? person.interests : ([] as Interest[])).map(item => (
                <Chip key={String(item.id)} label={item.title} selected />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

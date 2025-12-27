import React, {useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Alert, Image, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const NewMeetingPhotosScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft, resetMeetingDraft} = useAppContext();
  const [photos, setPhotos] = useState(state.newMeetingDraft.photos);
  const [loading, setLoading] = useState(false);

  const addRandomPhoto = () => {
    const seed = Math.floor(Math.random() * 1000);
    setPhotos(prev => [...prev, `https://picsum.photos/seed/meeting-${seed}/400/400`].slice(0, 9));
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const finish = () => {
    setLoading(true);
    updateMeetingDraft({photos});
    setTimeout(() => {
      setLoading(false);
      resetMeetingDraft();
      Alert.alert('Oluşturuldu', 'Etkinlik taslağın hazır. Listeye dönüyorsun.');
      navigation.navigate('MainTabs');
    }, 600);
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Fotoğraflar" onBack={() => navigation.goBack()} />
      <View style={{padding: 16, gap: 12, flex: 1}}>
        <Text style={{color: palette.textSecondary}}>
          En fazla 9 fotoğraf ekleyebilirsin. Kartlar, katılımcıların fikir edinmesini sağlar.
        </Text>
        <ScrollView contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap', gap: 12}}>
          {photos.map((uri, index) => (
            <TouchableOpacity key={uri} onPress={() => removePhoto(index)}>
              <Image
                source={{uri}}
                style={{width: 100, height: 100, borderRadius: 12, backgroundColor: palette.border}}
              />
              <Text style={{textAlign: 'center', color: palette.textSecondary, marginTop: 4}}>Kaldır</Text>
            </TouchableOpacity>
          ))}
          {photos.length < 9 ? (
            <TouchableOpacity
              onPress={addRandomPhoto}
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{color: palette.textSecondary}}>Foto ekle</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
        <View style={{flex: 1}} />
        <OutlinedButton label="Geri" onPress={() => navigation.goBack()} />
        <PrimaryButton label="Etkinliği oluştur" onPress={finish} disabled={loading || photos.length === 0} loading={loading} />
      </View>
    </Screen>
  );
};

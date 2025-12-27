import React, {useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Image, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterPhotos'>;

export const RegisterPhotosScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft, completeRegistration} = useAppContext();
  const [photos, setPhotos] = useState(state.registerDraft.photos);

  const addRandomPhoto = () => {
    const seed = Math.floor(Math.random() * 1000);
    setPhotos(prev => [...prev, `https://picsum.photos/seed/${seed}/400/400`].slice(0, 9));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    updateRegisterDraft({photos});
    completeRegistration({photos});
    navigation.reset({
      index: 0,
      routes: [{name: 'MainTabs'}]
    });
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Fotoğrafların" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, padding: 16, gap: 12}}>
        <Text style={{fontSize: 22, fontWeight: '700', color: palette.textPrimary}}>
          En az 1 fotoğraf ekle
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
        <PrimaryButton label="Kaydı tamamla" onPress={handleFinish} disabled={photos.length === 0} />
      </View>
    </Screen>
  );
};

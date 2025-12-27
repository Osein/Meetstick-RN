import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Text, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({navigation}) => {
  return (
    <Screen background="#fff">
      <AppHeader title="Hoş geldin" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, padding: 24, justifyContent: 'space-between'}}>
        <View>
          <Text style={{fontSize: 26, fontWeight: '700', color: palette.textPrimary, marginBottom: 12}}>
            Kayıt işlemini tamamlayalım
          </Text>
          <Text style={{fontSize: 16, color: palette.textSecondary}}>
            Birkaç kısa adımda profilini oluşturup topluluklara katılabilirsin.
          </Text>
        </View>

        <PrimaryButton label="Devam" onPress={() => navigation.navigate('RegisterInfo')} />
      </View>
    </Screen>
  );
};

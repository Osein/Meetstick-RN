import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const agreements = [
  {
    id: '1',
    title: 'Kullanım Koşulları',
    html: '<h1>Kullanım Koşulları</h1><p>Bu bir örnek metindir.</p>'
  },
  {
    id: '2',
    title: 'Gizlilik Politikası',
    html: '<h1>Gizlilik Politikası</h1><p>Verilerini güvende tutarız.</p>'
  }
];

export const AgreementsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <Screen>
      <AppHeader title="Sözleşmeler" onBack={() => navigation.goBack()} />
      <FlatList
        data={agreements}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 16, gap: 12}}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('WebView', {title: item.title, url: `data:text/html,${encodeURIComponent(item.html)}`})}
            style={{
              backgroundColor: palette.surface,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border
            }}
          >
            <Text style={{fontSize: 16, fontWeight: '600', color: palette.textPrimary}}>{item.title}</Text>
            <Text style={{color: palette.textSecondary, marginTop: 6}}>Görüntülemek için dokun</Text>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
};

import React from 'react';
import {Text, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';

export const MessagesScreen: React.FC = () => {
  return (
    <Screen>
      <AppHeader title="Mesajlar" />
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24}}>
        <Text style={{fontSize: 18, fontWeight: '600', color: palette.textPrimary}}>Mesaj kutusu boş</Text>
        <Text style={{textAlign: 'center', color: palette.textSecondary, marginTop: 8}}>
          Katıldığın etkinliklerde sohbet açıldığında burada belirecek.
        </Text>
      </View>
    </Screen>
  );
};

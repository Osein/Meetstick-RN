import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Switch, Text, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateNotificationSettings} = useAppContext();
  const settings = state.notificationSettings;

  const item = (label: string, value: boolean, onChange: (value: boolean) => void) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14
      }}
    >
      <Text style={{fontSize: 16, color: palette.textPrimary}}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );

  return (
    <Screen>
      <AppHeader title="Bildirim ayarları" onBack={() => navigation.goBack()} />
      <View style={{padding: 16, backgroundColor: palette.surface, margin: 16, borderRadius: 12}}>
        {item('Yeni sürüm bildirimleri', settings.newVersionEnabled, value =>
          updateNotificationSettings({newVersionEnabled: value})
        )}
        {item('Mesaj bildirimleri', settings.messagingEnabled, value =>
          updateNotificationSettings({messagingEnabled: value})
        )}
        {item('Öne çıkan etkinlikler', settings.featuredEventsEnabled, value =>
          updateNotificationSettings({featuredEventsEnabled: value})
        )}
      </View>
    </Screen>
  );
};

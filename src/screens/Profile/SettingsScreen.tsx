import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Linking, Platform, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {logout} = useAppContext();

  const openAppSettings = () => {
    if (Platform.OS === 'android' && Application.applicationId) {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: `package:${Application.applicationId}`
      }).catch(() => undefined);
      return;
    }

    Linking.openSettings().catch(() => undefined);
  };

  const menuItem = (label: string, onPress: () => void, danger = false) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Text style={{color: danger ? palette.primary : palette.textPrimary, fontSize: 16}}>{label}</Text>
      <Text style={{color: palette.muted}}>›</Text>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <AppHeader
        title="Ayarlar"
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
      />
      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 24}}>
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: palette.border
          }}
        >
          {menuItem('Konum ayarları', () => navigation.navigate('LocationSettings'))}
          {menuItem('İzin ayarları', openAppSettings)}
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: palette.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: palette.border
          }}
        >
          {menuItem('Sözleşmeler', () => navigation.navigate('Agreements'))}
          {menuItem('Bize ulaş', () => navigation.navigate('ContactUs'))}
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: palette.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: palette.border
          }}
        >
          {menuItem('Hesabı sil', () => navigation.navigate('DeleteAccount'), true)}
          {menuItem(
            'Çıkış yap',
            () => {
              logout();
              navigation.reset({index: 1, routes: [{name: 'Onboarding'}, {name: 'Login'}]});
            },
            true
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

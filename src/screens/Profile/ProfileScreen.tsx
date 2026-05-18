import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();
  const {state, logout} = useAppContext();
  const user = state.user;

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
      <AppHeader title="Profil" />
      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: tabBarHeight + 16}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            backgroundColor: palette.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.border
          }}
        >
          <Image
            source={{uri: user?.photos[0] || 'https://picsum.photos/200'}}
            style={{width: 72, height: 72, borderRadius: 36, backgroundColor: palette.border}}
          />
          <View style={{flex: 1}}>
            <Text style={{fontSize: 18, fontWeight: '700', color: palette.textPrimary, marginBottom: 4}}>
              {user?.name || 'Meetstick Üyesi'}
            </Text>
            <Text style={{color: palette.textSecondary}}>{user?.email || user?.phoneNumber}</Text>
          </View>
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
          {menuItem('Çıkış yap', () => {
            logout();
            navigation.reset({index: 1, routes: [{name: 'Onboarding'}, {name: 'Login'}]});
          }, true)}
        </View>
      </ScrollView>
    </Screen>
  );
};

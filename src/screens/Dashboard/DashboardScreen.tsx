import React, {useEffect, useState} from 'react';
import {FlatList, Image, Linking, Platform, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import {dashboardMeetings} from '@/data/mockData';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {Meeting} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PermissionState = 'GRANTED' | 'DENIED' | 'PERMANENTLY_DENIED';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [permission, setPermission] = useState<PermissionState>('DENIED');
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Meeting[]>([]);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (permission === 'GRANTED') {
      setItems(dashboardMeetings);
    }
  }, [permission]);

  useEffect(() => {
    const checkPermission = async () => {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted) {
        setPermission('GRANTED');
        return;
      }

      if (!current.canAskAgain) {
        setPermission('PERMANENTLY_DENIED');
        return;
      }

      setPermission('DENIED');
    };

    checkPermission().catch(() => {
      setPermission('DENIED');
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setItems(dashboardMeetings);
      setRefreshing(false);
    }, 800);
  };

  const requestLocationPermission = async () => {
    if (isRequestingPermission) {
      return;
    }

    try {
      setIsRequestingPermission(true);
      const result = await Location.requestForegroundPermissionsAsync();

      if (result.granted) {
        setPermission('GRANTED');
        return;
      }

      if (!result.canAskAgain) {
        setPermission('PERMANENTLY_DENIED');
        return;
      }

      setPermission('DENIED');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'android' && Application.applicationId) {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: `package:${Application.applicationId}`
      }).catch(() => undefined);
      return;
    }

    Linking.openURL('app-settings:').catch(() => undefined);
  };

  const renderContent = () => {
    if (permission === 'GRANTED') {
      return (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{padding: 16, gap: 14}}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
              style={{
                backgroundColor: palette.surface,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: palette.border
              }}
            >
              <Image source={{uri: item.featuredImageUrl}} style={{height: 200, width: '100%'}} />
              <View style={{padding: 14, gap: 8}}>
                <Text style={{fontSize: 20, fontWeight: '700', color: palette.textPrimary}}>{item.title}</Text>
                <Text style={{color: palette.textSecondary}}>
                  {item.location} • {new Date(item.dateTime).toLocaleDateString()}
                </Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PersonDetail', {personId: item.poster.id})}
                    style={{flexDirection: 'row', alignItems: 'center', gap: 8}}
                  >
                    <Image
                      source={{uri: item.poster.profileImageUrl}}
                      style={{width: 32, height: 32, borderRadius: 16, backgroundColor: palette.border}}
                    />
                    <Text style={{color: palette.textPrimary, fontWeight: '600'}}>{item.poster.name}</Text>
                  </TouchableOpacity>
                  <Text style={{color: palette.primary, fontWeight: '600'}}>
                    {item.attendeeCount} katılımcı
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      );
    }

    if (permission === 'PERMANENTLY_DENIED') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Konum izni gerekli</Text>
          <Text style={styles.cardText}>
            Çevrendeki etkinlikleri gösterebilmek için ayarlardan konum iznine izin ver.
          </Text>
          <TouchableOpacity onPress={openSystemSettings} style={[styles.button, {backgroundColor: palette.primary}]}>
            <Text style={{color: '#fff', fontWeight: '600'}}>Ayarlara git</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Konum izni olmadan devam</Text>
        <Text style={styles.cardText}>
          Yakınınızdaki etkinlikleri görebilmeniz için konum bilginize ihtiyacımız var.
        </Text>
        <TouchableOpacity onPress={requestLocationPermission} style={[styles.button, {backgroundColor: palette.primary}]}>
          <Text style={{color: '#fff', fontWeight: '600'}}>İzin ver</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Screen>
      <AppHeader title="Bana yakın" />
      {renderContent()}
    </Screen>
  );
};

const styles = {
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12
  },
  cardTitle: {fontSize: 20, fontWeight: '700', color: palette.textPrimary},
  cardText: {color: palette.textSecondary, lineHeight: 20},
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  }
};

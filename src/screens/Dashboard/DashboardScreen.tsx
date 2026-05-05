import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AppState,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import {Screen} from '@/components/Screen';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {useAppContext} from '@/context/AppContext';
import {getHomeFeed, HomeEvent, HomeInterestGroup} from '@/services/home/homeService';
import {showErrorToast} from '@/services/ui/toastService';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PermissionState = 'GRANTED' | 'DENIED';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state} = useAppContext();
  const tabBarHeight = useBottomTabBarHeight();
  const [permission, setPermission] = useState<PermissionState>('DENIED');
  const [refreshing, setRefreshing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isLoadingHome, setIsLoadingHome] = useState(false);
  const [homeFeed, setHomeFeed] = useState<{
    featuredEvents: HomeEvent[];
    upcomingEvents: HomeEvent[];
    groupedEvents: HomeInterestGroup[];
  }>({
    featuredEvents: [],
    upcomingEvents: [],
    groupedEvents: []
  });

  const featuredEvents = useMemo(() => homeFeed.featuredEvents.slice(0, 4), [homeFeed.featuredEvents]);
  const upcomingEvents = useMemo(() => homeFeed.upcomingEvents.slice(0, 2), [homeFeed.upcomingEvents]);
  const groupedEvents = useMemo(() => homeFeed.groupedEvents, [homeFeed.groupedEvents]);

  const refreshLocationPermission = useCallback(async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted) {
        setPermission('GRANTED');
        return;
      }
      setPermission('DENIED');
    } catch {
      setPermission('DENIED');
    }
  }, []);

  const loadHome = useCallback(async () => {
    try {
      setIsLoadingHome(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const response = await getHomeFeed({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accessToken: state.user?.accessToken
      });
      setHomeFeed(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Anasayfa verileri alınamadı.';
      showErrorToast(message);
    } finally {
      setIsLoadingHome(false);
    }
  }, [state.user?.accessToken]);

  useEffect(() => {
    refreshLocationPermission();
  }, [refreshLocationPermission]);

  useFocusEffect(
    useCallback(() => {
      refreshLocationPermission();
    }, [refreshLocationPermission])
  );

  useEffect(() => {
    if (permission === 'GRANTED') {
      loadHome();
      return;
    }

    requestLocationPermission();
  }, [permission, loadHome]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshLocationPermission();
      }
    });

    return () => subscription.remove();
  }, [refreshLocationPermission]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([refreshLocationPermission(), permission === 'GRANTED' ? loadHome() : Promise.resolve()]).finally(() => {
      setTimeout(() => setRefreshing(false), 400);
    });
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

    Linking.openSettings().catch(() => undefined);
  };

  const renderPermissionCard = () => {
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Konum izni gerekli</Text>
        <Text style={styles.permissionText}>
          Yakınınızdaki etkinlikleri görebilmek için konum izninize ihtiyacımız var.
        </Text>
        <TouchableOpacity activeOpacity={1} onPress={openSystemSettings} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Ayarlara Git</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderActivitySection = (title: string, items: HomeEvent[], showAll = true) => {
    if (!items.length) {
      return null;
    }

    return (
      <View style={styles.activitySection}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {showAll ? <Text style={styles.sectionAction}>Tümünü Gör</Text> : null}
        </View>
        {items.map(item => (
          <TouchableOpacity
            key={`${title}-${item.id}`}
            activeOpacity={1}
            style={styles.activityRow}
            onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
          >
            <Image source={{uri: item.coverPhoto}} style={styles.activityImage} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.posterRow}>
                <Image source={{uri: item.host?.avatar || undefined}} style={styles.posterAvatar} />
                <Text style={styles.posterName}>{item.host?.name || 'Meetstick'}</Text>
              </View>
              <Text style={styles.activityMeta}>
                {(item.location?.addressText || 'Konum bilgisi yok') +
                  ` · ${typeof item.acceptedCount === 'number' ? item.acceptedCount : 0} kişi`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Screen background={palette.background}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Etkinlikler</Text>
      </View>

      {permission !== 'GRANTED' ? (
        <View style={{paddingHorizontal: 16}}>{renderPermissionCard()}</View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={[styles.content, {paddingBottom: tabBarHeight + 16}]}
        >
          {isLoadingHome ? (
            <View style={{paddingTop: 36}}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : null}

          <View>
            <Text style={styles.sectionTitle}>Öne çıkan etkinlikler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {featuredEvents.map(item => (
                <TouchableOpacity
                  key={`featured-${item.id}`}
                  activeOpacity={1}
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
                >
                  <Image source={{uri: item.coverPhoto}} style={styles.featuredImage} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>{item.location?.addressText || '-'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Gelecek etkinlikler</Text>
            <View style={styles.upcomingRow}>
              {upcomingEvents.map(item => (
                <TouchableOpacity
                  key={`upcoming-${item.id}`}
                  activeOpacity={1}
                  style={styles.upcomingCard}
                  onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
                >
                  <Image source={{uri: item.coverPhoto}} style={styles.upcomingImage} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>{item.location?.addressText || '-'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {groupedEvents.map(group => renderActivitySection(group.interest.name, group.events))}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 36 / 2,
    fontWeight: '600',
    color: palette.textPrimary
  },
  content: {
    paddingHorizontal: 16,
    gap: 16
  },
  sectionTitle: {
    fontSize: 40 / 2,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12
  },
  horizontalList: {
    gap: 14,
    paddingRight: 16
  },
  featuredCard: {
    width: 330,
    gap: 6
  },
  featuredImage: {
    width: '100%',
    height: 410,
    borderRadius: 16,
    backgroundColor: palette.border
  },
  cardTitle: {
    fontSize: 37 / 2,
    fontWeight: '500',
    color: palette.textPrimary
  },
  cardDate: {
    fontSize: 18,
    color: '#8A6262'
  },
  upcomingRow: {
    flexDirection: 'row',
    gap: 14
  },
  upcomingCard: {
    flex: 1,
    gap: 6
  },
  upcomingImage: {
    width: '100%',
    height: 192,
    borderRadius: 16,
    backgroundColor: palette.border
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionAction: {
    fontSize: 38 / 2,
    fontWeight: '600',
    color: palette.textSecondary
  },
  activitySection: {
    marginTop: 4
  },
  activityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  activityImage: {
    width: 94,
    height: 94,
    borderRadius: 12,
    backgroundColor: palette.border
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 4
  },
  activityTitle: {
    fontSize: 20 / 1,
    fontWeight: '500',
    color: palette.textPrimary
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  posterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.border
  },
  posterName: {
    fontSize: 16,
    color: '#4F4F4F'
  },
  activityMeta: {
    fontSize: 33 / 2,
    color: '#4F4F4F'
  },
  permissionCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary
  },
  permissionText: {
    color: palette.textSecondary,
    lineHeight: 20
  },
  permissionButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

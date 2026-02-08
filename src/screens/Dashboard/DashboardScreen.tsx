import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AppState,
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
import {dashboardMeetings, getEventsForCategory} from '@/data/mockData';
import {Screen} from '@/components/Screen';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PermissionState = 'GRANTED' | 'DENIED' | 'PERMANENTLY_DENIED';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();
  const [permission, setPermission] = useState<PermissionState>('DENIED');
  const [refreshing, setRefreshing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const featuredMeetings = useMemo(() => dashboardMeetings.slice(0, 4), []);
  const upcomingMeetings = useMemo(() => dashboardMeetings.slice(4, 6), []);
  const halisahaItems = useMemo(() => getEventsForCategory(2, 'Halısaha').slice(0, 4), []);
  const concertItems = useMemo(() => getEventsForCategory(3, 'Konser').slice(0, 3), []);

  const refreshLocationPermission = useCallback(async () => {
    try {
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
    } catch {
      setPermission('DENIED');
    }
  }, []);

  useEffect(() => {
    refreshLocationPermission();
  }, [refreshLocationPermission]);

  useFocusEffect(
    useCallback(() => {
      refreshLocationPermission();
    }, [refreshLocationPermission])
  );

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
    refreshLocationPermission().finally(() => {
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

    Linking.openSettings().catch(() => undefined);
  };

  const renderPermissionCard = () => {
    if (permission === 'PERMANENTLY_DENIED') {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Konum izni gerekli</Text>
          <Text style={styles.permissionText}>
            Çevrendeki etkinlikleri gösterebilmek için ayarlardan konum iznini aç.
          </Text>
          <TouchableOpacity activeOpacity={1} onPress={openSystemSettings} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Ayarlara git</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Konum izni olmadan devam</Text>
        <Text style={styles.permissionText}>
          Yakınınızdaki etkinlikleri görebilmeniz için konum bilginize ihtiyacımız var.
        </Text>
        <TouchableOpacity activeOpacity={1} onPress={requestLocationPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>İzin ver</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderActivitySection = (title: string, items: typeof halisahaItems, showAll = true) => {
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
            <Image source={{uri: item.photos[0]}} style={styles.activityImage} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.posterRow}>
                <Image source={{uri: item.poster.profileImageUrl}} style={styles.posterAvatar} />
                <Text style={styles.posterName}>{item.poster.name}</Text>
              </View>
              <Text style={styles.activityMeta}>
                {item.location} · {item.attendeeCount} kişi
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
          <View>
            <Text style={styles.sectionTitle}>Öne çıkan etkinlikler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {featuredMeetings.map(item => (
                <TouchableOpacity
                  key={`featured-${item.id}`}
                  activeOpacity={1}
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
                >
                  <Image source={{uri: item.featuredImageUrl}} style={styles.featuredImage} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>{item.location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Gelecek etkinlikler</Text>
            <View style={styles.upcomingRow}>
              {upcomingMeetings.map(item => (
                <TouchableOpacity
                  key={`upcoming-${item.id}`}
                  activeOpacity={1}
                  style={styles.upcomingCard}
                  onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
                >
                  <Image source={{uri: item.featuredImageUrl}} style={styles.upcomingImage} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>{item.location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {renderActivitySection('Halısaha', halisahaItems)}
          {renderActivitySection('Konser', concertItems)}
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

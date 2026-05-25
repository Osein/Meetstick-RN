import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, AppState, FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {MeetingSmallCard} from '@/components/MeetingSmallCard';
import {RootStackParamList} from '@/navigation/types';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {EventListItem, getEventsPage} from '@/services/events/eventsService';
import {
  checkForegroundLocationPermission,
  getCurrentLocationCoords,
  requestForegroundLocationPermission
} from '@/services/location/locationService';
import {showErrorToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestMeetings'>;
type PermissionState = 'GRANTED' | 'DENIED';
type Coords = {lat: number; lng: number};

const PAGE_LIMIT = 20;

export const InterestMeetingsScreen: React.FC<Props> = ({navigation, route}) => {
  const {t} = useTranslation();
  const {state} = useAppContext();
  const insets = useSafeAreaInsets();
  const [permission, setPermission] = useState<PermissionState>('DENIED');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [items, setItems] = useState<EventListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const canLoadMore = useMemo(
    () => permission === 'GRANTED' && !isLoading && !isLoadingMore && page < totalPages,
    [isLoading, isLoadingMore, page, permission, totalPages]
  );

  const refreshLocationPermission = useCallback(async () => {
    try {
      const granted = await checkForegroundLocationPermission();
      setPermission(granted ? 'GRANTED' : 'DENIED');
      return granted;
    } catch {
      setPermission('DENIED');
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (isRequestingPermission) {
      return false;
    }

    try {
      setIsRequestingPermission(true);
      const granted = await requestForegroundLocationPermission();
      setPermission(granted ? 'GRANTED' : 'DENIED');
      return granted;
    } finally {
      setIsRequestingPermission(false);
    }
  }, [isRequestingPermission]);

  const ensureCoords = useCallback(async () => {
    const nextCoords = await getCurrentLocationCoords();
    setCoords(nextCoords);
    return nextCoords;
  }, []);

  const loadEvents = useCallback(
    async (nextPage: number, nextCoords: Coords, reset = false) => {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await getEventsPage({
          accessToken: state.user?.accessToken,
          interestId: route.params.interestId,
          lat: nextCoords.lat,
          lng: nextCoords.lng,
          page: nextPage,
          limit: PAGE_LIMIT
        });

        setItems(prev => {
          const merged = reset ? response.items : [...prev, ...response.items];
          return merged.filter((item, index, arr) => arr.findIndex(candidate => candidate.id === item.id) === index);
        });
        setPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('discover.interestMeetings.eventsError');
        showErrorToast(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [route.params.interestId, state.user?.accessToken, t]
  );

  const loadInitial = useCallback(async () => {
    const hasPermission = await refreshLocationPermission();
    const granted = hasPermission || (await requestLocationPermission());

    if (!granted) {
      setItems([]);
      setCoords(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentCoords = await ensureCoords();
      await loadEvents(1, currentCoords, true);
    } catch (error) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : t('discover.interestMeetings.locationError');
      showErrorToast(message);
    }
  }, [ensureCoords, loadEvents, refreshLocationPermission, requestLocationPermission, t]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [loadInitial])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshLocationPermission().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [refreshLocationPermission]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const granted = await refreshLocationPermission();
      if (!granted) {
        setItems([]);
        setCoords(null);
        return;
      }

      const currentCoords = await ensureCoords();
      await loadEvents(1, currentCoords, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('discover.interestMeetings.locationError');
      showErrorToast(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [ensureCoords, loadEvents, refreshLocationPermission, t]);

  const onLoadMore = useCallback(() => {
    if (!coords || !canLoadMore) {
      return;
    }

    loadEvents(page + 1, coords, false).catch(() => undefined);
  }, [canLoadMore, coords, loadEvents, page]);

  const openSystemSettings = useCallback(() => {
    if (Platform.OS === 'android' && Application.applicationId) {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: `package:${Application.applicationId}`
      }).catch(() => undefined);
      return;
    }

    Linking.openSettings().catch(() => undefined);
  }, []);

  const renderEmptyState = () => {
    if (permission !== 'GRANTED') {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>{t('discover.interestMeetings.permissionTitle')}</Text>
          <Text style={styles.permissionText}>{t('discover.interestMeetings.permissionDescription')}</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={openSystemSettings} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>{t('discover.interestMeetings.openSettings')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading) {
      return null;
    }

    return <Text style={styles.emptyText}>{t('discover.interestMeetings.empty')}</Text>;
  };

  return (
    <Screen background={palette.surface}>
      <AppHeader title={route.params.title} onBack={() => navigation.goBack()} />
      {isLoading && items.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 24}]}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          renderItem={({item}) => (
            <MeetingSmallCard item={item} onPress={id => navigation.navigate('EventDetail', {eventId: id})} />
          )}
          ListEmptyComponent={renderEmptyState()}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerLoader: {
    paddingVertical: 16
  },
  emptyText: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 24
  },
  permissionCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary
  },
  permissionButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});

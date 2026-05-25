import React, {useCallback, useMemo, useState} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {EmptyStateCreateEvent} from '@/components/EmptyStateCreateEvent';
import {RootStackParamList} from '@/navigation/types';
import {useAppContext} from '@/context/AppContext';
import {getRefreshVersion, subscribeRefresh} from '@/services/refresh/refreshStore';
import {getMyEvents, MyEventItem, MyEventsType} from '@/services/events/myEventsService';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ProfileTab = 'myEvents' | 'pastEvents';

type TabState = {
  items: MyEventItem[];
  page: number;
  totalPages: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  initialized: boolean;
};

const profileImage = 'https://www.figma.com/api/mcp/asset/5a3d26a5-a093-49b9-b1bc-3a777ef2e11e';
const initialTabState: TabState = {
  items: [],
  page: 1,
  totalPages: 1,
  isLoading: false,
  isLoadingMore: false,
  initialized: false
};

const tabToType = (tab: ProfileTab): MyEventsType => (tab === 'myEvents' ? 'active' : 'past');

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state} = useAppContext();
  const user = state.user;
  const isFocused = useIsFocused();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<ProfileTab>('myEvents');
  const [myState, setMyState] = useState<TabState>(initialTabState);
  const [pastState, setPastState] = useState<TabState>(initialTabState);
  const activeTabRef = React.useRef<ProfileTab>('myEvents');
  const myStateRef = React.useRef<TabState>(initialTabState);
  const pastStateRef = React.useRef<TabState>(initialTabState);
  const requestSeqRef = React.useRef<{myEvents: number; pastEvents: number}>({
    myEvents: 0,
    pastEvents: 0
  });

  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  React.useEffect(() => {
    myStateRef.current = myState;
  }, [myState]);
  React.useEffect(() => {
    pastStateRef.current = pastState;
  }, [pastState]);

  const setTabState = useCallback((tab: ProfileTab, updater: (prev: TabState) => TabState) => {
    if (tab === 'myEvents') {
      setMyState(prev => updater(prev));
      return;
    }
    setPastState(prev => updater(prev));
  }, []);

  const loadEvents = useCallback(
    async (tab: ProfileTab, reset = false) => {
      const current = tab === 'myEvents' ? myStateRef.current : pastStateRef.current;
      const nextPage = reset ? 1 : current.page + 1;
      const requestId = requestSeqRef.current[tab] + 1;
      requestSeqRef.current[tab] = requestId;

      setTabState(tab, prev => ({
        ...prev,
        isLoading: reset,
        isLoadingMore: !reset,
        ...(reset ? {items: []} : {})
      }));

      try {
        const response = await getMyEvents({
          accessToken: user?.accessToken,
          type: tabToType(tab),
          page: nextPage,
          limit: 20
        });

        setTabState(tab, prev => {
          if (requestSeqRef.current[tab] !== requestId) {
            return prev;
          }
          const merged = reset ? response.items : [...prev.items, ...response.items];
          const unique = merged.filter((item, index, arr) => arr.findIndex(x => x.id === item.id) === index);

          return {
            ...prev,
            items: unique,
            page: response.pagination.page,
            totalPages: response.pagination.totalPages,
            isLoading: false,
            isLoadingMore: false,
            initialized: true
          };
        });
      } catch {
      } finally {
        setTabState(tab, prev => {
          if (requestSeqRef.current[tab] !== requestId) {
            return prev;
          }
          return {
            ...prev,
            isLoading: false,
            isLoadingMore: false,
            initialized: true
          };
        });
      }
    },
    [setTabState, user?.accessToken]
  );

  React.useEffect(() => {
    if (!isFocused) {
      return;
    }
    loadEvents(activeTab, true);
  }, [activeTab, isFocused, loadEvents]);

  React.useEffect(() => {
    let previousVersion = getRefreshVersion('profile');

    const unsubscribe = subscribeRefresh(() => {
      const nextVersion = getRefreshVersion('profile');
      if (nextVersion !== previousVersion) {
        previousVersion = nextVersion;
        loadEvents(activeTabRef.current, true);
      }
    });

    return unsubscribe;
  }, [loadEvents]);

  const onPressTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    const tabState = tab === 'myEvents' ? myState : pastState;
    if (!tabState.initialized && !tabState.isLoading) {
      loadEvents(tab, true);
    }
  };

  const activeState = activeTab === 'myEvents' ? myState : pastState;
  const visibleEvents = activeState.items;

  const canLoadMore = useMemo(
    () => !activeState.isLoading && !activeState.isLoadingMore && activeState.page < activeState.totalPages,
    [activeState.isLoading, activeState.isLoadingMore, activeState.page, activeState.totalPages]
  );

  return (
    <Screen background="#FFFFFF">
      <AppHeader
        title={user?.name || 'Meetstick Üyesi'}
        rightElement={
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color="#A8A29E" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: tabBarHeight + 24}}
        style={styles.scroll}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.9} onPress={() => navigation.navigate('EditProfilePhotos')}>
            <Image source={{uri: user?.photos[0] || profileImage}} style={styles.avatar} />
            <View style={styles.editAvatarButton}>
              <Ionicons name="pencil" size={12} color="#A8A29E" />
            </View>
          </TouchableOpacity>

          {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'myEvents' && styles.tabButtonActive]}
            onPress={() => onPressTab('myEvents')}
          >
            <Text style={[styles.tabText, activeTab === 'myEvents' && styles.tabTextActive]}>{`MY EVENTS (${myState.items.length})`}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pastEvents' && styles.tabButtonActive]}
            onPress={() => onPressTab('pastEvents')}
          >
            <Text style={[styles.tabText, activeTab === 'pastEvents' && styles.tabTextActive]}>PAST EVENTS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.eventList}>
          {!activeState.initialized || activeState.isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color="#FF6F61" />
            </View>
          ) : visibleEvents.length === 0 ? (
            <EmptyStateCreateEvent
              title="Henüz etkinlik yok"
              description="Yeni bir etkinlik oluşturarak hemen başla! Tüm planlarını buradan takip edebilirsin."
              buttonLabel="ETKİNLİK OLUŞTUR"
              onPress={() => navigation.navigate('NewMeetingDetails')}
            />
          ) : (
            <>
              {visibleEvents.map(item => (
                <View key={item.id} style={styles.eventItem}>
                  <Image source={{uri: item.image || undefined}} style={styles.eventImage} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventDate}>{item.date}</Text>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="#A8A29E" />
                      <Text style={styles.eventLocation}>{item.location}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#D6D3D1" />
                </View>
              ))}

              {canLoadMore ? (
                <TouchableOpacity style={styles.loadMoreButton} onPress={() => loadEvents(activeTab, false)}>
                  <Text style={styles.loadMoreText}>Daha fazla yükle</Text>
                </TouchableOpacity>
              ) : null}

              {activeState.isLoadingMore ? (
                <View style={styles.loaderMoreWrap}>
                  <ActivityIndicator size="small" color="#FF6F61" />
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scroll: {
    flex: 1
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F5F4'
  },
  editAvatarButton: {
    position: 'absolute',
    right: -4,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bio: {
    marginTop: 20,
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 23,
    color: '#78716C'
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
    marginTop: 24,
    marginHorizontal: 24
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 14
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6F61'
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#A8A29E',
    fontWeight: '700'
  },
  tabTextActive: {
    color: '#FF6F61'
  },
  eventList: {
    paddingTop: 24,
    paddingHorizontal: 24
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center'
  },
  loaderMoreWrap: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  loadMoreButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E7E5E4'
  },
  loadMoreText: {
    color: '#78716C',
    fontSize: 13,
    fontWeight: '600'
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAF9',
    paddingVertical: 20
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 2,
    backgroundColor: '#FAFAF9'
  },
  eventContent: {
    flex: 1,
    gap: 2
  },
  eventDate: {
    color: '#FF6F61',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    fontWeight: '700'
  },
  eventTitle: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  eventLocation: {
    color: '#A8A29E',
    fontSize: 11,
    lineHeight: 16.5
  }
});

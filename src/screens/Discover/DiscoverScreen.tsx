import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {Interest} from '@/types';
import {MeetingSmallCard} from '@/components/MeetingSmallCard';
import {getInterests, setInterestFavorite} from '@/services/interests/interestsService';
import {EventListItem, getEventsPage} from '@/services/events/eventsService';
import {useAppContext} from '@/context/AppContext';
import {showErrorToast} from '@/services/ui/toastService';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const SEARCH_PAGE_LIMIT = 20;

export const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();
  const {state} = useAppContext();
  const {t} = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [searchResults, setSearchResults] = useState<EventListItem[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false);
  const [isTogglingFavoriteId, setIsTogglingFavoriteId] = useState<string | number | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const query = searchText.trim();

  const runSearch = useCallback(async (nextPage = 1, reset = false) => {
    if (!query) {
      setSearchResults([]);
      setSearchPage(1);
      setSearchTotalPages(1);
      return;
    }

    try {
      if (reset) {
        setIsLoadingSearch(true);
      } else if (nextPage > 1) {
        setIsLoadingMoreSearch(true);
      } else {
        setIsLoadingSearch(true);
      }

      const response = await getEventsPage({
        accessToken: state.user?.accessToken,
        query,
        page: nextPage,
        limit: SEARCH_PAGE_LIMIT
      });

      setSearchResults(prev => {
        const merged = reset ? response.items : [...prev, ...response.items];
        return merged.filter((item, index, arr) => arr.findIndex(candidate => candidate.id === item.id) === index);
      });
      setSearchPage(response.pagination.page);
      setSearchTotalPages(response.pagination.totalPages);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('discover.searchError');
      showErrorToast(message);
    } finally {
      setIsLoadingSearch(false);
      setIsLoadingMoreSearch(false);
    }
  }, [query, state.user?.accessToken, t]);

  const favoriteInterests = useMemo(
    () => interests.filter(item => item.isFavorite).sort((a, b) => a.title.localeCompare(b.title, 'tr')),
    [interests]
  );

  const otherInterests = useMemo(
    () => interests.filter(item => !item.isFavorite).sort((a, b) => a.title.localeCompare(b.title, 'tr')),
    [interests]
  );

  const loadInterests = useCallback(async () => {
    try {
      setIsLoadingInterests(true);
      const response = await getInterests();
      setInterests(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('discover.interestsError');
      showErrorToast(message);
    } finally {
      setIsLoadingInterests(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadInterests();
    }, [loadInterests])
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      runSearch(1, true);
    }, 400);

    return () => clearTimeout(timeout);
  }, [runSearch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadInterests(), runSearch(1, true)]);
    setRefreshing(false);
  };

  const toggleFavorite = useCallback(
    async (interest: Interest) => {
      const nextIsFavorite = !interest.isFavorite;
      setIsTogglingFavoriteId(interest.id);

      setInterests(prev => prev.map(item => (item.id === interest.id ? {...item, isFavorite: nextIsFavorite} : item)));

      try {
        await setInterestFavorite({interestId: interest.id, isFavorite: nextIsFavorite});
      } catch (error) {
        setInterests(prev => prev.map(item => (item.id === interest.id ? {...item, isFavorite: !nextIsFavorite} : item)));
        const message = error instanceof Error ? error.message : t('discover.favoriteError');
        showErrorToast(message);
      } finally {
        setIsTogglingFavoriteId(null);
      }
    },
    [t]
  );

  const openInterest = useCallback(
    (interest: Interest) => {
      navigation.navigate('InterestMeetings', {
        interestId: interest.id,
        title: interest.title
      });
    },
    [navigation]
  );

  const renderInterestSection = (title: string, items: Interest[]) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map(item => (
          <TouchableOpacity key={String(item.id)} style={styles.interestRow} activeOpacity={0.9} onPress={() => openInterest(item)}>
            <Text style={styles.interestTitle}>{item.title}</Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(item)}
              disabled={isTogglingFavoriteId === item.id}
              style={styles.starButton}
            >
              <Ionicons
                name={item.isFavorite ? 'star' : 'star-outline'}
                size={18}
                color={item.isFavorite ? '#F59E0B' : palette.muted}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSearchResults = () => {
    if (isLoadingSearch) {
      return null;
    }

    if (searchResults.length === 0) {
      return (
        <Text style={styles.emptyText}>
          {t('discover.emptySearch')}
        </Text>
      );
    }
  };

  const canLoadMoreSearch = query.length > 0 && !isLoadingSearch && !isLoadingMoreSearch && searchPage < searchTotalPages;

  const onLoadMoreSearch = useCallback(() => {
    if (!canLoadMoreSearch) {
      return;
    }

    runSearch(searchPage + 1, false).catch(() => undefined);
  }, [canLoadMoreSearch, runSearch, searchPage]);

  const renderSearchHeader = () => (
    <View style={styles.searchRow}>
      <Ionicons name="search" size={18} color={palette.muted} />
      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder={t('discover.searchPlaceholder')}
        placeholderTextColor={palette.muted}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {searchText.length > 0 ? (
        <TouchableOpacity onPress={() => setSearchText('')}>
          <Ionicons name="close-circle" size={18} color={palette.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <Screen background={palette.surface}>
      <AppHeader title={t('discover.title')} />
      {query ? (
        <FlatList
          data={searchResults}
          keyExtractor={item => `search-${item.id}`}
          renderItem={({item}) => (
            <MeetingSmallCard item={item} onPress={id => navigation.navigate('EventDetail', {eventId: id})} />
          )}
          ListHeaderComponent={renderSearchHeader()}
          ListEmptyComponent={
            isLoadingSearch ? <ActivityIndicator color={palette.primary} style={styles.loader} /> : renderSearchResults()
          }
          ListFooterComponent={
            isLoadingMoreSearch ? (
              <View style={styles.loaderMore}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : null
          }
          onEndReached={onLoadMoreSearch}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, {paddingBottom: tabBarHeight + 20, flexGrow: 1}]}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={[styles.content, {paddingBottom: tabBarHeight + 20}]}
        >
          {renderSearchHeader()}
          {isLoadingInterests ? (
            <ActivityIndicator color={palette.primary} style={styles.loader} />
          ) : (
            <>
              {renderInterestSection(t('discover.favoriteInterests'), favoriteInterests)}
              {renderInterestSection(t('discover.otherInterests'), otherInterests)}
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 14,
    backgroundColor: palette.surface
  },
  searchRow: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E2',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.textPrimary,
    paddingVertical: 0
  },
  loader: {
    marginTop: 20
  },
  loaderMore: {
    paddingVertical: 16
  },
  section: {
    marginTop: 4,
    gap: 8,
    backgroundColor: palette.surface
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4
  },
  interestRow: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E2',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  interestTitle: {
    fontSize: 16,
    color: palette.textPrimary,
    fontWeight: '500'
  },
  starButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E2'
  },
  emptyText: {
    color: palette.textSecondary,
    fontSize: 14,
    marginTop: 8
  }
});

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CommonActions} from '@react-navigation/native';
import {ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppHeader} from '@/components/AppHeader';
import {Screen} from '@/components/Screen';
import {RootStackParamList} from '@/navigation/types';
import {searchPlaces, PlaceSearchItem} from '@/services/places/placesService';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {showErrorToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'NewMeetingLocationSearch'>;

const MIN_REQUEST_INTERVAL_MS = 1000;
const INPUT_DEBOUNCE_MS = 400;

export const NewMeetingLocationSearchScreen: React.FC<Props> = ({navigation, route}) => {
  const {state} = useAppContext();
  const {t} = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const lastRequestAtRef = useRef(0);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      requestControllerRef.current?.abort();
    };
  }, []);

  const runSearch = async (searchText: string, isRetry = false) => {
    if (searchText.length < 2) {
      requestControllerRef.current?.abort();
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastRequestAtRef.current;
    const waitMs = elapsed >= MIN_REQUEST_INTERVAL_MS ? 0 : MIN_REQUEST_INTERVAL_MS - elapsed;

    if (waitMs > 0 && !isRetry) {
      retryTimeoutRef.current = setTimeout(() => {
        runSearch(searchText, true);
      }, waitMs);
      return;
    }

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    lastRequestAtRef.current = Date.now();
    setIsLoading(true);

    try {
      const items = await searchPlaces({
        query: searchText,
        accessToken: state.user?.accessToken,
        lat: route.params?.lat,
        lng: route.params?.lng,
        limit: 8,
        signal: controller.signal
      });

      if (controller.signal.aborted) {
        return;
      }

      setResults(items);
      setHasSearched(true);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Konum araması yapılamadı.';
      if (message.includes('429')) {
        retryTimeoutRef.current = setTimeout(() => {
          runSearch(searchText, true);
        }, 1000);
        return;
      }

      setResults([]);
      setHasSearched(true);
      showErrorToast(message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (trimmedQuery.length < 2) {
      requestControllerRef.current?.abort();
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      runSearch(trimmedQuery);
    }, INPUT_DEBOUNCE_MS);
  }, [trimmedQuery]);

  const handleSelect = (item: PlaceSearchItem) => {
    const state = navigation.getState();
    const previousRoute = state.routes[state.routes.length - 2];

    if (previousRoute?.name === 'NewMeetingLocation') {
      navigation.dispatch({
        ...CommonActions.setParams({
          focusedPlace: {
            placeId: item.id,
            name: item.title,
            address: item.fullAddress,
            lat: item.latitude,
            lng: item.longitude
          }
        }),
        source: previousRoute.key
      });
      navigation.goBack();
      return;
    }

    navigation.navigate('NewMeetingLocation', {
      focusedPlace: {
        placeId: item.id,
        name: item.title,
        address: item.fullAddress,
        lat: item.latitude,
        lng: item.longitude
      }
    });
  };

  return (
    <Screen background="#FFFFFF">
      <AppHeader title={t('newMeeting.location.searchTitle')} onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('newMeeting.location.searchPlaceholder')}
          autoFocus
          style={styles.input}
          returnKeyType="search"
        />

        {isLoading ? (
          <View style={styles.feedbackWrap}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : null}

        {!isLoading && hasSearched && results.length === 0 ? (
          <View style={styles.feedbackWrap}>
            <Text style={styles.feedbackText}>{t('common.noPlacesFound')}</Text>
          </View>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => handleSelect(item)} style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowAddress} numberOfLines={2}>
                {item.fullAddress}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: palette.textPrimary,
    backgroundColor: '#FFFFFF'
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary
  },
  rowAddress: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary
  },
  feedbackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24
  },
  feedbackText: {
    fontSize: 14,
    color: palette.textSecondary
  }
});

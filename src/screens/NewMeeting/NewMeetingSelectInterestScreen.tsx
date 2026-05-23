import React, {useEffect, useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaFrame, useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {Chip} from '@/components/Chip';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {Interest} from '@/types';
import {getInterests} from '@/services/interests/interestsService';
import {showErrorToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'NewMeetingSelectInterest'>;

export const NewMeetingSelectInterestScreen: React.FC<Props> = ({navigation}) => {
  const {state, updateMeetingDraft} = useAppContext();
  const insets = useSafeAreaInsets();
  const safeAreaFrame = useSafeAreaFrame();
  const [selected, setSelected] = useState<Interest[]>(state.newMeetingDraft.interests || []);
  const [uiState, setUiState] = useState<{interestList: Interest[]; isLoading: boolean}>({
    interestList: [],
    isLoading: true
  });

  useEffect(() => {
    console.log('[interest-screen] mounted', {
      insets,
      safeAreaFrame,
      isLoading: uiState.isLoading
    });
  }, []);

  useEffect(() => {
    console.log('[interest-screen] safe-area changed', {
      insets,
      safeAreaFrame,
      isLoading: uiState.isLoading,
      interestCount: uiState.interestList.length
    });
  }, [insets, safeAreaFrame, uiState.isLoading, uiState.interestList.length]);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        console.log('[interest-screen] fetch start', {
          insets,
          safeAreaFrame
        });
        const response = await getInterests();
        console.log('[interest-screen] fetch success', {
          count: response.length,
          insets,
          safeAreaFrame
        });
        setUiState({
          interestList: response,
          isLoading: false
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ilgi alanlari alinamadi.';
        console.log('[interest-screen] fetch error', {
          message,
          insets,
          safeAreaFrame
        });
        showErrorToast(message);
        setUiState(prev => ({
          interestList: prev.interestList,
          isLoading: false
        }));
      }
    };

    fetchInterests();
  }, []);

  const toggle = (interest: Interest) => {
    setSelected(prev =>
      prev.find(item => item.id === interest.id)
        ? prev.filter(item => item.id !== interest.id)
        : [...prev, interest]
    );
  };

  const canSubmit = useMemo(() => selected.length >= 1, [selected]);

  const handleSubmit = () => {
    updateMeetingDraft({interests: selected});
    navigation.goBack();
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Kategori Sec" onBack={() => navigation.goBack()} />
      <View
        style={styles.container}
        onLayout={event => {
          const {x, y, width, height} = event.nativeEvent.layout;
          console.log('[interest-screen] container layout', {
            x,
            y,
            width,
            height,
            insets,
            isLoading: uiState.isLoading
          });
        }}
      >
        <Text style={styles.title}>En az 1 kategori sec</Text>
        <Text style={styles.description}>
          Etkinligini en iyi anlatan bir veya birden fazla kategori sec.
        </Text>

        <View style={styles.content}>
          {uiState.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={palette.primary} />
              <Text style={styles.loadingText}>Kategoriler yukleniyor...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {uiState.interestList.map(item => (
                <Chip
                  key={String(item.id)}
                  label={item.title}
                  selected={!!selected.find(s => s.id === item.id)}
                  onPress={() => toggle(item)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {!uiState.isLoading ? (
          <View style={[styles.buttonWrap]}>
            <PrimaryButton label="Sec" onPress={handleSubmit} disabled={!canSubmit} />
          </View>
        ) : (
          <View style={[styles.buttonPlaceholder]} />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
    marginBottom: 16
  },
  content: {
    flex: 1
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: palette.textSecondary
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 16
  },
  buttonWrap: {
    paddingTop: 12
  },
  buttonPlaceholder: {
    height: 66
  }
});

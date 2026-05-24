import React, {useEffect, useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import {useTranslation} from 'react-i18next';
import MapView, {Marker} from 'react-native-maps';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {cancelJoinEvent, EventDetailData, getEventById, joinEvent} from '@/services/events/eventsService';
import {showErrorToast, showSuccessToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

type ParticipantItem = {
  id: string;
  name: string;
  image?: string;
};

const formatEventDate = (dateValue: string, locale: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const formatEventTimeRange = (startValue: string, endValue: string | null | undefined, locale: string) => {
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) {
    return '-';
  }

  const end = endValue ? new Date(endValue) : new Date(start);
  if (!endValue) {
    end.setHours(start.getHours() + 3);
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit'
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

const getJoinAction = (status: EventDetailData['myJoinStatus']) => {
  if (status === 'pending') {
    return 'cancel';
  }
  if (status === 'accepted') {
    return 'joined';
  }
  return 'join';
};

export const EventDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const {t} = useTranslation();
  const {state} = useAppContext();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;

    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const response = await getEventById({
          id: route.params.eventId,
          accessToken: state.user?.accessToken
        });

        if (!active) {
          return;
        }

        setEvent(response);
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Etkinlik detayı alınamadı.';
        showErrorToast(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      active = false;
    };
  }, [route.params.eventId, state.user?.accessToken]);

  const deviceLocale = Localization.getLocales()[0]?.languageTag || 'tr-TR';

  const participants = useMemo<ParticipantItem[]>(() => {
    if (!event) {
      return [];
    }

    const accepted = event.acceptedParticipants.slice(0, 4).map(user => ({
      id: user.id,
      name: user.name,
      image: user.avatar
    }));

    const host = event.host
      ? {
          id: `host-${event.host.id}`,
          name: event.host.name,
          image: event.host.avatar
        }
      : null;

    if (!host) {
      return accepted;
    }

    const exists = accepted.some(item => item.name === host.name);
    return exists ? accepted : [host, ...accepted].slice(0, 5);
  }, [event]);

  const joinAction = getJoinAction(event?.myJoinStatus ?? null);

  const isCurrentUserHost = useMemo(() => {
    if (!event) {
      return false;
    }

    if (state.user?.id && event.host?.id) {
      return state.user.id === event.host.id;
    }

    return event.isHost;
  }, [event, state.user?.id]);

  const onJoinPress = async () => {
    if (!event || isCurrentUserHost || isSubmittingJoin || joinAction === 'joined') {
      return;
    }

    try {
      setIsSubmittingJoin(true);

      if (joinAction === 'cancel') {
        await cancelJoinEvent({id: event.id, accessToken: state.user?.accessToken});
        setEvent(prev => (prev ? {...prev, myJoinStatus: null} : prev));
        showSuccessToast('Katılma isteği geri çekildi.');
        return;
      }

      await joinEvent({id: event.id, accessToken: state.user?.accessToken});
      setEvent(prev => (prev ? {...prev, myJoinStatus: 'pending'} : prev));
      showSuccessToast('Katılma isteği gönderildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'İşlem gerçekleştirilemedi.';
      showErrorToast(message);
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  if (isLoading || !event) {
    return (
      <Screen background="#FFFFFF">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('eventDetail.loading')}</Text>
        </View>
      </Screen>
    );
  }

  const totalParticipants = typeof event.acceptedCount === 'number' ? event.acceptedCount : event.acceptedParticipantsCount;
  const extraParticipantCount = Math.max(0, totalParticipants - participants.length);
  const heroImage = event.photos[0];
  const showHostInsights = isCurrentUserHost;
  const hasMapLocation = typeof event.latitude === 'number' && typeof event.longitude === 'number';

  return (
    <Screen background="#FFFFFF">
      <View style={styles.container}>
        <ScrollView
          style={{marginTop: -insets.top}}
          contentContainerStyle={[styles.scrollContent, !isCurrentUserHost ? styles.scrollContentWithCta : null]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroSection, {height: 280 + insets.top}]}>
            {heroImage ? <Image source={{uri: heroImage}} style={styles.heroImage} resizeMode="cover" /> : null}
            <View style={styles.heroOverlay} />
            <View style={[styles.heroNav, {top: insets.top + 16}]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroButton}>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroButton}>
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contentCard}>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{event.title}</Text>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#78716C" />
                  <Text style={styles.infoText}>{formatEventDate(event.startsAt || '', deviceLocale)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color="#78716C" />
                  <Text style={styles.infoText}>{formatEventTimeRange(event.startsAt || '', event.endsAt, deviceLocale)}</Text>
                </View>

                <View style={[styles.infoRow, styles.locationRow]}>
                  <Ionicons name="location-outline" size={20} color="#78716C" />
                  <View style={styles.locationBody}>
                    <View style={styles.locationHeader}>
                      <View style={{flex: 1}}>
                        <Text style={styles.infoText}>{event.addressText || '-'}</Text>
                      </View>
                    </View>

                    <View style={styles.mapPreview}>
                      {hasMapLocation ? (
                        <MapView
                          style={styles.mapView}
                          pointerEvents="none"
                          scrollEnabled={false}
                          zoomEnabled={false}
                          rotateEnabled={false}
                          pitchEnabled={false}
                          toolbarEnabled={false}
                          initialRegion={{
                            latitude: event.latitude!,
                            longitude: event.longitude!,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01
                          }}
                        >
                          <Marker coordinate={{latitude: event.latitude!, longitude: event.longitude!}} />
                        </MapView>
                      ) : (
                        <View style={styles.mapPinOuter}>
                          <View style={styles.mapPinInner} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>{t('eventDetail.about.title')}</Text>
                <Text style={styles.descriptionText}>{event.description || '-'}</Text>
              </View>

              <View style={styles.participantsSection}>
                <View style={styles.participantsHeader}>
                  <Text style={styles.participantsTitle}>
                    {t('eventDetail.participants.title')} ({totalParticipants})
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>{t('eventDetail.participants.seeAll')}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.participantList}>
                  {participants.map(participant => (
                    <View key={participant.id} style={styles.participantItem}>
                      {participant.image ? (
                        <Image source={{uri: participant.image}} style={styles.avatar} resizeMode="cover" />
                      ) : (
                        <View style={styles.avatarPlaceholder} />
                      )}
                      <Text style={styles.participantName} numberOfLines={1}>
                        {participant.name}
                      </Text>
                    </View>
                  ))}

                  {extraParticipantCount > 0 ? (
                    <View style={styles.participantItem}>
                      <View style={styles.moreCircle}>
                        <Text style={styles.moreCountText}>+{extraParticipantCount}</Text>
                      </View>
                      <Text style={styles.participantName}>{t('eventDetail.participants.more')}</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>

              {showHostInsights ? (
                <View style={styles.ownerSection}>
                  <Text style={styles.sectionLabel}>OWNER INSIGHTS</Text>
                  <View style={styles.ownerCard}>
                    <Text style={styles.ownerCardTitle}>Applicants ({event.applicantsCount})</Text>
                    <Text style={styles.ownerCardText} numberOfLines={2}>
                      {event.applicants.slice(0, 3).map(item => item.name).join(', ') || 'No applicants yet'}
                    </Text>
                  </View>
                  <View style={styles.ownerCard}>
                    <Text style={styles.ownerCardTitle}>Accepted ({event.acceptedParticipantsCount})</Text>
                    <Text style={styles.ownerCardText} numberOfLines={2}>
                      {event.acceptedParticipants.slice(0, 3).map(item => item.name).join(', ') || 'No accepted participants yet'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>

        {!isCurrentUserHost ? (
          <View style={styles.bottomCta}>
            <View>
              <Text style={styles.priceLabel}>{t('eventDetail.price.label')}</Text>
              <Text style={styles.priceValue}>{t('eventDetail.price.value')}</Text>
            </View>

            <TouchableOpacity
              style={[styles.joinButton, isSubmittingJoin || joinAction === 'joined' ? styles.joinButtonDisabled : null]}
              onPress={onJoinPress}
              disabled={isSubmittingJoin || joinAction === 'joined'}
            >
              <Text style={styles.joinButtonText}>
                {joinAction === 'cancel'
                  ? t('eventDetail.cta.cancelRequest')
                  : joinAction === 'joined'
                    ? t('eventDetail.cta.joined')
                    : t('eventDetail.cta.join')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: palette.textSecondary,
    fontSize: 16
  },
  scrollContent: {
    paddingBottom: 32
  },
  scrollContentWithCta: {
    paddingBottom: 132
  },
  heroSection: {
    height: 280,
    backgroundColor: '#F5F5F4'
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)'
  },
  heroNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contentCard: {
    marginTop: -24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF'
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 48,
    rowGap: 18
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700'
  },
  infoSection: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4'
  },
  locationRow: {
    alignItems: 'flex-start'
  },
  infoText: {
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 24
  },
  locationBody: {
    flex: 1,
    rowGap: 16
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  mapPreview: {
    height: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  mapView: {
    width: '100%',
    height: '100%'
  },
  mapPinOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,107,107,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mapPinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary
  },
  descriptionSection: {
    rowGap: 12
  },
  sectionLabel: {
    color: '#78716C',
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  descriptionText: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 26
  },
  participantsSection: {
    rowGap: 16
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  participantsTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  seeAllText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  participantList: {
    columnGap: 16,
    paddingRight: 24
  },
  participantItem: {
    width: 52,
    alignItems: 'center',
    rowGap: 8
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F4'
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F4'
  },
  participantName: {
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center'
  },
  moreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  moreCountText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  ownerSection: {
    rowGap: 10
  },
  ownerCard: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    padding: 12,
    rowGap: 4
  },
  ownerCardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700'
  },
  ownerCardText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20
  },
  bottomCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 24
  },
  priceLabel: {
    color: '#78716C',
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  priceValue: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700'
  },
  joinButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 8
  },
  joinButtonDisabled: {
    opacity: 0.6
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  hostBadge: {
    display: 'none'
  },
  hostBadgeText: {
    display: 'none'
  }
});

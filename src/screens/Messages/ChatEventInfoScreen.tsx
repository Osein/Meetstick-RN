import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {RootStackParamList} from '@/navigation/types';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {cancelJoinEvent, EventDetailData, getEventById, joinEvent} from '@/services/events/eventsService';
import {showErrorToast, showSuccessToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatEventInfo'>;

const screenWidth = Dimensions.get('window').width;
const imageWidth = screenWidth - 32;

const Avatar: React.FC<{name: string; avatar?: string}> = ({name, avatar}) => {
  if (avatar) {
    return <Image source={{uri: avatar}} style={{width: 44, height: 44, borderRadius: 22, backgroundColor: '#ddd'}} />;
  }

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#B8D8FF',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Text style={{color: '#174A7E', fontWeight: '700'}}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
};

export const ChatEventInfoScreen: React.FC<Props> = ({navigation, route}) => {
  const {state} = useAppContext();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<FlatList<string>>(null);

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

  const onCarouselScrollEnd = (eventNative: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(eventNative.nativeEvent.contentOffset.x / imageWidth);
    setActiveIndex(nextIndex);
  };

  const participantCountLabel = useMemo(() => {
    if (!event) {
      return '0 kişi';
    }
    const count = typeof event.acceptedCount === 'number' ? event.acceptedCount : event.acceptedParticipants.length;
    return `${count} kişi`;
  }, [event]);

  const shouldShowJoinActions = useMemo(
    () => !route.params.fromChat && !!event && event.isHost === false,
    [route.params.fromChat, event]
  );

  const hasJoinRequest = useMemo(() => {
    const status = event?.myJoinStatus?.toLowerCase();
    return status === 'pending' || status === 'accepted';
  }, [event?.myJoinStatus]);

  const handleJoin = async () => {
    if (!event || isSubmittingJoin) {
      return;
    }

    try {
      setIsSubmittingJoin(true);
      await joinEvent({id: event.id, accessToken: state.user?.accessToken});
      setEvent(prev => (prev ? {...prev, myJoinStatus: 'pending'} : prev));
      showSuccessToast('Katılma isteği gönderildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Katılma isteği gönderilemedi.';
      showErrorToast(message);
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleCancelJoin = async () => {
    if (!event || isSubmittingJoin) {
      return;
    }

    try {
      setIsSubmittingJoin(true);
      await cancelJoinEvent({id: event.id, accessToken: state.user?.accessToken});
      setEvent(prev => (prev ? {...prev, myJoinStatus: null} : prev));
      showSuccessToast('Katılma isteği geri çekildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Katılma isteği iptal edilemedi.';
      showErrorToast(message);
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  return (
    <Screen background="#E9E9EA">
      <AppHeader title={route.params.title} onBack={() => navigation.goBack()} />
      {isLoading || !event ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: palette.textSecondary}}>Yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{paddingBottom: 28}}>
          <View style={{paddingHorizontal: 16, paddingTop: 12}}>
            {event.photos.length <= 1 ? (
              <View style={{height: 258, borderRadius: 0, overflow: 'hidden', backgroundColor: '#D8D8D8'}}>
                <Image source={{uri: event.photos[0]}} style={{width: '100%', height: '100%'}} resizeMode="cover" />
              </View>
            ) : (
              <View>
                <FlatList
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  data={event.photos}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onCarouselScrollEnd}
                  renderItem={({item}) => (
                    <View style={{width: imageWidth, height: 258, overflow: 'hidden', backgroundColor: '#D8D8D8'}}>
                      <Image source={{uri: item}} style={{width: '100%', height: '100%'}} resizeMode="cover" />
                    </View>
                  )}
                />
                <View style={{position: 'absolute', left: 0, right: 0, bottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8}}>
                  {event.photos.map((_, index) => (
                    <View
                      key={`dot-${index}`}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: index === activeIndex ? '#FF4E8A' : 'rgba(255,255,255,0.9)'
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={{paddingTop: 14, gap: 14}}>
              <Text style={{fontSize: 38 / 2, fontWeight: '700', color: '#343434'}}>{event.title}</Text>

              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Ionicons name="navigate-circle-outline" size={24} color="#2E2E2E" />
                <Text style={{flex: 1, fontSize: 16, color: '#3C3C3C'}}>{event.addressText || 'Konum bilgisi yok'}</Text>
              </View>

              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Ionicons name="person-circle-outline" size={24} color="#2E2E2E" />
                <Text style={{fontSize: 16, color: '#3C3C3C'}}>{participantCountLabel}</Text>
              </View>

              <View style={{height: 1, backgroundColor: '#C9C9C9'}} />

              <Text style={{fontSize: 17, fontWeight: '700', color: '#393939'}}>Etkinlik Bilgileri</Text>
              <Text style={{fontSize: 16, lineHeight: 30, color: '#3B3B3B'}}>
                {event.description || 'Bu etkinlik için açıklama bilgisi bulunmuyor.'}
              </Text>

              <View style={{height: 1, backgroundColor: '#C9C9C9'}} />

              <Text style={{fontSize: 17, fontWeight: '700', color: '#393939'}}>Katılımcılar</Text>
              <View style={{gap: 12}}>
                {event.acceptedParticipants.length > 0 ? (
                  event.acceptedParticipants.map(user => (
                    <TouchableOpacity
                      key={`accepted-${user.id}`}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PersonDetail', {personId: user.id})}
                      style={{flexDirection: 'row', alignItems: 'center', gap: 10}}
                    >
                      <Avatar name={user.name} avatar={user.avatar} />
                      <View>
                        <Text style={{fontSize: 16, fontWeight: '600', color: '#2F2F2F'}}>{user.name}</Text>
                        <Text style={{fontSize: 14, color: user.isApproved ? '#E54979' : '#7B7B7B'}}>
                          {user.isApproved ? 'Onaylı Üye' : 'Katılımcı'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{color: '#6E6E6E'}}>Henüz katılımcı yok.</Text>
                )}
              </View>

              {event.applicants.length > 0 ? (
                <>
                  <Text style={{fontSize: 17, fontWeight: '700', color: '#393939'}}>Başvurular</Text>
                  <View style={{gap: 12}}>
                    {event.applicants.map(user => (
                      <TouchableOpacity
                        key={`applicant-${user.id}`}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('PersonDetail', {personId: user.id})}
                        style={{flexDirection: 'row', alignItems: 'center', gap: 10}}
                      >
                        <Avatar name={user.name} avatar={user.avatar} />
                        <View>
                          <Text style={{fontSize: 16, fontWeight: '600', color: '#2F2F2F'}}>{user.name}</Text>
                          <Text style={{fontSize: 14, color: '#7B7B7B'}}>Başvuru bekliyor</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}

              <View style={{height: 1, backgroundColor: '#C9C9C9'}} />

              <Text style={{fontSize: 17, fontWeight: '700', color: '#393939'}}>Chat Ayarları</Text>
              <View style={{gap: 8}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 16, color: '#3C3C3C'}}>Bildirimler</Text>
                  <Text style={{fontSize: 15, color: '#7A7A7A'}}>Açık</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 16, color: '#3C3C3C'}}>Medyayı Galeriye Kaydet</Text>
                  <Text style={{fontSize: 15, color: '#7A7A7A'}}>Kapalı</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 16, color: '#3C3C3C'}}>Sohbeti Temizle</Text>
                  <Text style={{fontSize: 15, color: '#D05454'}}>Sil</Text>
                </View>
              </View>

              {shouldShowJoinActions ? (
                <View style={{paddingTop: 6}}>
                  {hasJoinRequest ? (
                    <OutlinedButton
                      label="Katılma isteğinden vazgeç"
                      onPress={handleCancelJoin}
                      disabled={isSubmittingJoin}
                    />
                  ) : (
                    <PrimaryButton
                      label="Katılma isteği gönder"
                      onPress={handleJoin}
                      disabled={isSubmittingJoin}
                      loading={isSubmittingJoin}
                    />
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
};

import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PhotoCarousel} from '@/components/PhotoCarousel';
import {palette} from '@/theme/colors';
import {Event, ParticipantRequest} from '@/types';
import {getEventDetail} from '@/data/mockData';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

export const EventDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setEvent(getEventDetail(route.params.eventId));
      setLoading(false);
    }, 400);
  }, [route.params.eventId]);

  const updateRequests = (requestId: string, status: ParticipantRequest['status']) => {
    setEvent(prev =>
      prev
        ? {
            ...prev,
            participantRequests: prev.participantRequests.map(req =>
              req.id === requestId ? {...req, status} : req
            )
          }
        : prev
    );
  };

  if (!event || loading) {
    return (
      <Screen>
        <AppHeader title="Etkinlik" onBack={() => navigation.goBack()} />
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text>Yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  const isOwner = event.ownerId === 1;

  return (
    <Screen>
      <AppHeader title="Etkinlik detay" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        <PhotoCarousel photos={event.photos} />
        <View style={{padding: 16, gap: 12}}>
          <Text style={{fontSize: 22, fontWeight: '700', color: palette.textPrimary}}>{event.title}</Text>
          <Text style={{color: palette.textSecondary}}>{event.location}</Text>
          {event.attendeeCount > 0 ? (
            <Text style={{color: palette.primary, fontWeight: '600'}}>{event.attendeeCount} kişi</Text>
          ) : null}

          <Text style={{fontWeight: '700', color: palette.textPrimary}}>Açıklama</Text>
          <Text style={{color: palette.textSecondary, lineHeight: 20}}>{event.description}</Text>

          <Text style={{fontWeight: '700', color: palette.textPrimary}}>Organizatör</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PersonDetail', {personId: event.poster.id})}
            style={{flexDirection: 'row', alignItems: 'center', gap: 10}}
          >
            <Text style={{color: palette.textPrimary, fontWeight: '600'}}>{event.poster.name}</Text>
            {event.poster.isVerified ? <Text style={{color: palette.primary}}>✔︎ Doğrulandı</Text> : null}
          </TouchableOpacity>

          {isOwner && event.participantRequests.length ? (
            <View style={{gap: 8}}>
              <Text style={{fontWeight: '700', color: palette.textPrimary}}>
                Katılım isteği ({event.participantRequests.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12}}>
                {event.participantRequests.map(request => (
                  <View
                    key={request.id}
                    style={{
                      width: 140,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: palette.border,
                      backgroundColor: palette.surface,
                      gap: 8
                    }}
                  >
                    <Text style={{fontWeight: '600'}}>{request.person.name}</Text>
                    <Text style={{color: palette.textSecondary, fontSize: 12}}>Beklemede</Text>
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <TouchableOpacity
                        onPress={() => updateRequests(request.id, 'ACCEPTED')}
                        style={{flex: 1, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8}}
                      >
                        <Text style={{textAlign: 'center', color: '#2E7D32'}}>Kabul</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateRequests(request.id, 'REJECTED')}
                        style={{flex: 1, backgroundColor: '#FFEBEE', padding: 8, borderRadius: 8}}
                      >
                        <Text style={{textAlign: 'center', color: '#C62828'}}>Red</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View
            style={{
              backgroundColor: '#FFF5F5',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: palette.primaryLight
            }}
          >
            <Text style={{color: palette.textSecondary}}>
              Meetstick güvenlik ipucu: Tanışma öncesi konumu paylaşmadan önce katılımcıları doğrula.
            </Text>
          </View>

          {!isOwner ? (
            event.hasRequestedToJoin ? (
              <OutlinedButton
                label="Talebi iptal et"
                onPress={() => setEvent(prev => (prev ? {...prev, hasRequestedToJoin: false} : prev))}
              />
            ) : (
              <PrimaryButton
                label="Etkinliğe katıl"
                onPress={() => setEvent(prev => (prev ? {...prev, hasRequestedToJoin: true} : prev))}
              />
            )
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
};

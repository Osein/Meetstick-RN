import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlatList, Image, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {Event} from '@/types';
import {getEventsForCategory} from '@/data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'EventList'>;

export const EventListScreen: React.FC<Props> = ({navigation, route}) => {
  const {categoryId, categoryTitle} = route.params;
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setEvents(getEventsForCategory(categoryId, categoryTitle));
  };

  useEffect(() => {
    load();
  }, [categoryId, categoryTitle]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      load();
      setRefreshing(false);
    }, 700);
  };

  return (
    <Screen>
      <AppHeader title={categoryTitle} onBack={() => navigation.goBack()} />
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{padding: 16, gap: 14}}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
            style={{
              backgroundColor: palette.surface,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: palette.border
            }}
          >
            <Image source={{uri: item.photos[0]}} style={{height: 200, width: '100%'}} />
            <View style={{padding: 14, gap: 8}}>
              <Text style={{fontSize: 18, fontWeight: '700', color: palette.textPrimary}}>{item.title}</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PersonDetail', {personId: item.poster.id})}
                  style={{flexDirection: 'row', alignItems: 'center', gap: 8}}
                >
                  <Image
                    source={{uri: item.poster.profileImageUrl}}
                    style={{width: 24, height: 24, borderRadius: 12, backgroundColor: palette.border}}
                  />
                  <Text style={{color: palette.textSecondary}}>{item.poster.name}</Text>
                </TouchableOpacity>
                <Text style={{color: palette.primary, fontWeight: '600'}}>
                  {item.attendeeCount} kişi
                </Text>
              </View>
              <Text style={{color: palette.textSecondary}} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
};

import React, {useEffect, useState} from 'react';
import {FlatList, Image, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {dashboardMeetings} from '@/data/mockData';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {Meeting} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PermissionState = 'GRANTED' | 'DENIED' | 'PERMANENTLY_DENIED';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [permission, setPermission] = useState<PermissionState>('DENIED');
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Meeting[]>([]);

  useEffect(() => {
    if (permission === 'GRANTED') {
      setItems(dashboardMeetings);
    }
  }, [permission]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setItems(dashboardMeetings);
      setRefreshing(false);
    }, 800);
  };

  const renderContent = () => {
    if (permission === 'GRANTED') {
      return (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{padding: 16, gap: 14}}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('EventDetail', {eventId: item.id})}
              style={{
                backgroundColor: palette.surface,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: palette.border
              }}
            >
              <Image source={{uri: item.featuredImageUrl}} style={{height: 200, width: '100%'}} />
              <View style={{padding: 14, gap: 8}}>
                <Text style={{fontSize: 20, fontWeight: '700', color: palette.textPrimary}}>{item.title}</Text>
                <Text style={{color: palette.textSecondary}}>
                  {item.location} • {new Date(item.dateTime).toLocaleDateString()}
                </Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PersonDetail', {personId: item.poster.id})}
                    style={{flexDirection: 'row', alignItems: 'center', gap: 8}}
                  >
                    <Image
                      source={{uri: item.poster.profileImageUrl}}
                      style={{width: 32, height: 32, borderRadius: 16, backgroundColor: palette.border}}
                    />
                    <Text style={{color: palette.textPrimary, fontWeight: '600'}}>{item.poster.name}</Text>
                  </TouchableOpacity>
                  <Text style={{color: palette.primary, fontWeight: '600'}}>
                    {item.attendeeCount} katılımcı
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      );
    }

    if (permission === 'PERMANENTLY_DENIED') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Konum izni gerekli</Text>
          <Text style={styles.cardText}>
            Çevrendeki etkinlikleri gösterebilmek için ayarlardan konum iznine izin ver.
          </Text>
          <TouchableOpacity
            onPress={() => setPermission('GRANTED')}
            style={[styles.button, {backgroundColor: palette.primary}]}
          >
            <Text style={{color: '#fff', fontWeight: '600'}}>İzni açtım</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Konum izni olmadan devam</Text>
        <Text style={styles.cardText}>Yakındaki etkinlikleri gösterebilmek için konum iznine ihtiyacımız var.</Text>
        <TouchableOpacity
          onPress={() => setPermission('GRANTED')}
          style={[styles.button, {backgroundColor: palette.primary}]}
        >
          <Text style={{color: '#fff', fontWeight: '600'}}>İzin ver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPermission('PERMANENTLY_DENIED')}
          style={[styles.button, {backgroundColor: '#fff', borderWidth: 1, borderColor: palette.border}]}
        >
          <Text style={{color: palette.textPrimary}}>Daha sonra</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Screen>
      <AppHeader title="Bana yakın" />
      {renderContent()}
    </Screen>
  );
};

const styles = {
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12
  },
  cardTitle: {fontSize: 20, fontWeight: '700', color: palette.textPrimary},
  cardText: {color: palette.textSecondary, lineHeight: 20},
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  }
};

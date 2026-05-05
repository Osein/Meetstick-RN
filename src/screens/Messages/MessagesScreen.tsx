import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, AppState, FlatList, Image, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {ChatListItem, getChatList} from '@/services/chat/chatsService';
import {showErrorToast} from '@/services/ui/toastService';
import {RootStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();
  const {state} = useAppContext();
  const [items, setItems] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');

  const fetchChats = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await getChatList(state.user?.accessToken);
        setItems(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sohbet listesi alınamadı.';
        showErrorToast(message);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [state.user?.accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isFocused || !isAppActive) {
      return;
    }

    fetchChats();
    const intervalId = setInterval(() => {
      fetchChats(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchChats, isFocused, isAppActive]);

  return (
    <Screen>
      <AppHeader title="Mesajlar" />
      {isLoading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.eventId}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: tabBarHeight + 16
          }}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ChatRoom', {eventId: item.eventId, title: item.title})}
              style={{
                flexDirection: 'row',
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
                paddingVertical: 12
              }}
            >
              <Image
                source={{uri: item.coverPhoto}}
                style={{width: 56, height: 56, borderRadius: 12, backgroundColor: palette.border}}
              />
              <View style={{flex: 1, gap: 4, justifyContent: 'center'}}>
                <Text style={{fontSize: 16, fontWeight: '700', color: palette.textPrimary}} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{fontSize: 14, color: palette.textSecondary}} numberOfLines={1}>
                  {item.lastMessageSenderName ? `${item.lastMessageSenderName}: ` : ''}
                  {item.lastMessageText || 'Henüz mesaj yok'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
              <Text style={{fontSize: 18, fontWeight: '600', color: palette.textPrimary}}>Mesaj kutusu boş</Text>
              <Text style={{textAlign: 'center', color: palette.textSecondary, marginTop: 8}}>
                Katıldığın etkinliklerde sohbet açıldığında burada belirecek.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
};

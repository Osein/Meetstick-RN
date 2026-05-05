import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, AppState, FlatList, Image, Pressable, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import * as ImagePicker from 'expo-image-picker';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {RootStackParamList} from '@/navigation/types';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {
  ChatMessageItem,
  getChatMessages,
  markChatMessagesSeen,
  sendChatMessage,
  uploadChatMedia
} from '@/services/chat/chatsService';
import {showErrorToast} from '@/services/ui/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

type PendingUploadItem = {
  id: string;
  localUri: string;
  progress: number;
  status: 'uploading' | 'sending' | 'failed';
};

export const ChatRoomScreen: React.FC<Props> = ({navigation, route}) => {
  const {state} = useAppContext();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [text, setText] = useState('');
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');

  const fetchMessages = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }

        const response = await getChatMessages({
          eventId: route.params.eventId,
          accessToken: state.user?.accessToken,
          limit: 50
        });
        setMessages(response.items);
        const newestMessageId = response.items[response.items.length - 1]?.id;
        if (newestMessageId) {
          markChatMessagesSeen({
            eventId: route.params.eventId,
            cursorMessageId: newestMessageId,
            accessToken: state.user?.accessToken
          }).catch(() => undefined);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Mesajlar alınamadı.';
        showErrorToast(message);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [route.params.eventId, state.user?.accessToken]
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

    fetchMessages();
    const intervalId = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchMessages, isFocused, isAppActive]);

  const mergedItems = useMemo<ChatMessageItem[]>(
    () => [
      ...messages,
      ...pendingUploads.map(upload => ({
        id: upload.id,
        type: 'photo',
        photoUrl: upload.localUri,
        senderId: state.user?.id,
        senderName: state.user?.name,
        text:
          upload.status === 'sending'
            ? 'Gönderiliyor...'
            : upload.status === 'failed'
              ? 'Yükleme başarısız'
              : `Yükleniyor %${Math.round(upload.progress * 100)}`
      }))
    ],
    [messages, pendingUploads, state.user?.id, state.user?.name]
  );

  const handleSendText = useCallback(async () => {
    if (!text.trim().length || isSendingText) {
      return;
    }

    try {
      setIsSendingText(true);
      const sent = await sendChatMessage({
        eventId: route.params.eventId,
        accessToken: state.user?.accessToken,
        type: 'text',
        text: text.trim()
      });
      setMessages(prev => [...prev, sent]);
      markChatMessagesSeen({
        eventId: route.params.eventId,
        cursorMessageId: sent.id,
        accessToken: state.user?.accessToken
      }).catch(() => undefined);
      setText('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mesaj gönderilemedi.';
      showErrorToast(message);
    } finally {
      setIsSendingText(false);
    }
  }, [isSendingText, route.params.eventId, state.user?.accessToken, text]);

  const handlePickAndSendPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showErrorToast('Fotoğraf seçebilmek için galeri izni gerekli.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setPendingUploads(prev => [...prev, {id: tempId, localUri: asset.uri, progress: 0, status: 'uploading'}]);

    try {
      const uploaded = await uploadChatMedia({
        eventId: route.params.eventId,
        accessToken: state.user?.accessToken,
        fileUri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        onProgress: progress => {
          setPendingUploads(prev =>
            prev.map(item => (item.id === tempId ? {...item, progress, status: 'uploading'} : item))
          );
        }
      });

      setPendingUploads(prev =>
        prev.map(item => (item.id === tempId ? {...item, progress: 1, status: 'sending'} : item))
      );

      const sent = await sendChatMessage({
        eventId: route.params.eventId,
        accessToken: state.user?.accessToken,
        type: 'photo',
        photoUrl: uploaded.url
      });

      setMessages(prev => [...prev, sent]);
      markChatMessagesSeen({
        eventId: route.params.eventId,
        cursorMessageId: sent.id,
        accessToken: state.user?.accessToken
      }).catch(() => undefined);
      setPendingUploads(prev => prev.filter(item => item.id !== tempId));
    } catch (error) {
      setPendingUploads(prev =>
        prev.map(item => (item.id === tempId ? {...item, status: 'failed'} : item))
      );
      const message = error instanceof Error ? error.message : 'Fotoğraf gönderilemedi.';
      showErrorToast(message);
    }
  }, [route.params.eventId, state.user?.accessToken]);

  return (
    <Screen background="#fff">
      <AppHeader
        title={route.params.title}
        onBack={() => navigation.goBack()}
        onTitlePress={() =>
          navigation.navigate('ChatEventInfo', {
            eventId: route.params.eventId,
            title: route.params.title,
            fromChat: true
          })
        }
      />
      <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
        <KeyboardDismissView style={{flex: 1}}>
          <FlatList
            data={mergedItems}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 16, gap: 10, flexGrow: 1}}
            inverted={false}
            renderItem={({item}) => {
              const isMine = item.senderId && state.user?.id ? item.senderId === state.user.id : false;

              return (
                <View style={{alignItems: isMine ? 'flex-end' : 'flex-start'}}>
                  <View
                    style={{
                      maxWidth: '82%',
                      backgroundColor: isMine ? palette.primary : '#F1F2F4',
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10
                    }}
                  >
                    {!isMine && item.senderName ? (
                      <Text style={{fontSize: 12, color: palette.textSecondary, marginBottom: 4}}>{item.senderName}</Text>
                    ) : null}
                    {item.photoUrl ? (
                      <Image
                        source={{uri: item.photoUrl}}
                        style={{width: 180, height: 180, borderRadius: 10, backgroundColor: '#DADDE2'}}
                      />
                    ) : null}
                    {item.text ? (
                      <Text style={{color: isMine ? '#fff' : palette.textPrimary, marginTop: item.photoUrl ? 8 : 0}}>
                        {item.text}
                      </Text>
                    ) : null}
                    {!item.text && !item.photoUrl ? (
                      <Text style={{color: isMine ? '#fff' : palette.textPrimary}}>{`[${item.type}]`}</Text>
                    ) : null}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              !isLoading ? (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                  <Text style={{color: palette.textSecondary}}>Bu odada henüz mesaj yok.</Text>
                </View>
              ) : null
            }
          />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: palette.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Pressable
              onPress={handlePickAndSendPhoto}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{fontSize: 20, color: palette.textPrimary}}>+</Text>
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Mesaj yaz..."
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                color: palette.textPrimary
              }}
              multiline
            />
            <Pressable
              onPress={handleSendText}
              disabled={isSendingText || !text.trim().length}
              style={{
                paddingHorizontal: 14,
                height: 40,
                borderRadius: 10,
                backgroundColor: isSendingText || !text.trim().length ? palette.border : palette.primary,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isSendingText ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{color: '#fff', fontWeight: '700'}}>Gönder</Text>
              )}
            </Pressable>
          </View>
        </KeyboardDismissView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

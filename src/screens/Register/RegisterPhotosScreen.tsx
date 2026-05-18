import React, {useCallback, useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Alert, Image, Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Sortable, {SortableGridRenderItem} from 'react-native-sortables';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterPhotos'>;
const GRID_COUNT = 9;
const MIN_REQUIRED_PHOTOS = 3;

type PhotoCell = {
  id: string;
  uri: string | null;
};
type PickerSource = 'camera' | 'library';

const buildCellsFromUris = (uris: string[]): PhotoCell[] => {
  const sanitizedUris = uris.filter(uri => typeof uri === 'string' && uri.trim().length > 0);
  const photoCells: PhotoCell[] = sanitizedUris.slice(0, GRID_COUNT).map((uri, index) => ({
    id: `photo-${index}-${uri}`,
    uri
  }));

  while (photoCells.length < GRID_COUNT) {
    photoCells.push({
      id: `empty-${photoCells.length}`,
      uri: null
    });
  }

  return photoCells;
};

const normalizeCells = (cells: PhotoCell[]): PhotoCell[] => {
  const uris = cells
    .map(cell => cell.uri)
    .filter((uri): uri is string => typeof uri === 'string' && uri.trim().length > 0);

  return buildCellsFromUris(uris);
};

export const RegisterPhotosScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateRegisterDraft, completeRegistration} = useAppContext();
  const [cells, setCells] = useState<PhotoCell[]>(() => buildCellsFromUris(state.registerDraft.photos));
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const normalizedCells = useMemo(() => normalizeCells(cells), [cells]);
  const photos = useMemo(
    () => normalizedCells.filter(item => item.uri).map(item => item.uri as string),
    [normalizedCells]
  );
  const canFinish = photos.length >= MIN_REQUIRED_PHOTOS;
  const activeCell = activeCellIndex === null ? null : normalizedCells[activeCellIndex];

  const closeSheet = () => {
    setActiveCellIndex(null);
  };

  const openCellSheet = (index: number) => {
    setActiveCellIndex(index);
  };

  const setCellUri = (index: number, uri: string | null) => {
    setCells(prev => {
      const updated = normalizeCells(prev).map((cell, i) => (i === index ? {...cell, uri} : cell));
      return normalizeCells(updated);
    });
  };

  const openImagePicker = async (source: PickerSource) => {
    if (activeCellIndex === null) {
      return;
    }

    const targetIndex = activeCellIndex;

    try {
      if (source === 'library') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('İzin gerekli', 'Fotoğraf seçebilmek için galeri izni vermen gerekiyor.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1
        });

        if (!result.canceled && result.assets.length > 0) {
          setCellUri(targetIndex, result.assets[0].uri);
        }
        return;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin gerekli', 'Fotoğraf çekebilmek için kamera izni vermen gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1
      });

      if (!result.canceled && result.assets.length > 0) {
        setCellUri(targetIndex, result.assets[0].uri);
      }
    } catch {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu. Lütfen tekrar dene.');
    } finally {
      closeSheet();
    }
  };

  const removeActivePhoto = () => {
    if (activeCellIndex === null) {
      return;
    }

    setCellUri(activeCellIndex, null);
    closeSheet();
  };

  const handleFinish = () => {
    updateRegisterDraft({photos});
    completeRegistration({photos});
    navigation.reset({
      index: 0,
      routes: [{name: 'MainTabs'}]
    });
  };

  const renderItem = useCallback<SortableGridRenderItem<PhotoCell>>(
    ({item, index}) => (
      <Sortable.Handle mode={item.uri ? 'draggable' : 'fixed-order'} style={{width: '100%'}}>
        <Sortable.Touchable onTap={() => openCellSheet(index)}>
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 14,
              backgroundColor: item.uri ? palette.border : 'transparent',
              overflow: item.uri ? 'hidden' : 'visible'
            }}
          >
            {item.uri ? (
              <Image source={{uri: item.uri}} style={{width: '100%', height: '100%'}} />
            ) : (
              <View style={{flex: 1, backgroundColor: '#F5F5F7', borderRadius: 14}} />
            )}

            {!item.uri ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: '#26292C'
                }}
              />
            ) : null}

            {!item.uri ? (
              <View
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#FF6F61',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{color: '#fff', fontSize: 16, lineHeight: 16, fontWeight: '700'}}>+</Text>
              </View>
            ) : null}
          </View>
        </Sortable.Touchable>
      </Sortable.Handle>
    ),
    []
  );

  return (
    <Screen>
      <AppHeader title="Kayıt Ol" onBack={() => navigation.goBack()} />
      <View style={{flex: 1, paddingHorizontal: 16, paddingTop: 16}}>
        <Text style={{fontSize: 24, lineHeight: 24, fontWeight: '700', color: palette.textPrimary}}>
          Kendini göster:
        </Text>
        <Text style={{fontSize: 16, lineHeight: 20, color: palette.textSecondary, marginTop: 4}}>
          En az 3 tane ilgi çekici fotoğrafını ekleyerek etkinliklere katılma şansını arttırabilirsin.
        </Text>

        <View style={{marginTop: 18}}>
          <Sortable.Grid
            data={normalizedCells}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            columns={3}
            rowGap={12}
            columnGap={12}
            customHandle
            dragActivationDelay={220}
            onDragEnd={({data}) => setCells(normalizeCells(data))}
          />
        </View>

        <View style={{flex: 1}} />
        <View style={{marginBottom: 16}}>
          <PrimaryButton label="Kullanmaya Başla" onPress={handleFinish} disabled={!canFinish} />
        </View>
      </View>

      <Modal visible={activeCellIndex !== null} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{flex: 1, justifyContent: 'flex-end'}}>
          <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.28)'}} onPress={closeSheet} />
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 12,
              paddingBottom: 24
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600',
                color: palette.textPrimary
              }}
            >
              Fotoğraf Seçimi
            </Text>

            <View style={{paddingHorizontal: 16, paddingTop: 12}}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  overflow: 'hidden'
                }}
              >
                <TouchableOpacity
                  onPress={() => openImagePicker('camera')}
                  style={{
                    height: 52,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{fontSize: 18, color: '#007AFF'}}>Kamera ile Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openImagePicker('library')}
                  style={{
                    height: 52,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{fontSize: 18, color: '#007AFF'}}>
                    {activeCell?.uri ? 'Galeriden Değiştir' : 'Galeriden Fotoğraf Seç'}
                  </Text>
                </TouchableOpacity>

                {activeCell?.uri ? (
                  <>
                    <TouchableOpacity
                      onPress={removeActivePhoto}
                      style={{
                        height: 52,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Text style={{fontSize: 18, color: '#FF3B30'}}>Fotoğrafı Kaldır</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={closeSheet}
                style={{
                  marginTop: 10,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{fontSize: 18, fontWeight: '600', color: '#007AFF'}}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Image, Text, View} from 'react-native';
import Sortable, {SortableGridRenderItem} from 'react-native-sortables';
import {palette} from '@/theme/colors';
import {PhotoSourcePickerSheet} from '@/components/PhotoSourcePickerSheet';
import {pickPhoto, PhotoPickerSource} from '@/services/media/photoPickerService';

type PhotoCell = {
  id: string;
  uri: string | null;
};

type Props = {
  photos: string[];
  onChangePhotos: (photos: string[]) => void;
};

const GRID_COUNT = 9;

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

export const ProfilePhotosGridNine: React.FC<Props> = ({photos, onChangePhotos}) => {
  const [cells, setCells] = useState<PhotoCell[]>(() => buildCellsFromUris(photos));
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);

  useEffect(() => {
    setCells(buildCellsFromUris(photos));
  }, [photos]);

  const normalizedCells = useMemo(() => normalizeCells(cells), [cells]);

  const emitPhotos = (nextCells: PhotoCell[]) => {
    const uris = normalizeCells(nextCells)
      .filter(item => item.uri)
      .map(item => item.uri as string);
    onChangePhotos(uris);
  };

  const closeSheet = () => setActiveCellIndex(null);

  const setCellUri = (index: number, uri: string | null) => {
    setCells(prev => {
      const updated = normalizeCells(prev).map((cell, i) => (i === index ? {...cell, uri} : cell));
      const next = normalizeCells(updated);
      emitPhotos(next);
      return next;
    });
  };

  const openImagePicker = async (source: PhotoPickerSource) => {
    if (activeCellIndex === null) return;

    const targetIndex = activeCellIndex;

    try {
      const result = await pickPhoto(source);
      if (result.status === 'permission_denied') {
        Alert.alert('İzin gerekli', result.message);
        return;
      }
      if (result.status === 'success') {
        setCellUri(targetIndex, result.uri);
      }
    } catch {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu. Lütfen tekrar dene.');
    } finally {
      closeSheet();
    }
  };

  const removeActivePhoto = () => {
    if (activeCellIndex === null) return;
    setCellUri(activeCellIndex, null);
    closeSheet();
  };

  const renderItem: SortableGridRenderItem<PhotoCell> = ({item, index}) => (
    <Sortable.Handle mode={item.uri ? 'draggable' : 'fixed-order'} style={{width: '100%'}}>
      <Sortable.Touchable onTap={() => setActiveCellIndex(index)}>
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
  );

  return (
    <>
      <Sortable.Grid
        data={normalizedCells}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        columns={3}
        rowGap={12}
        columnGap={12}
        customHandle
        dragActivationDelay={220}
        onDragEnd={({data}) => {
          const next = normalizeCells(data);
          setCells(next);
          emitPhotos(next);
        }}
      />

      <PhotoSourcePickerSheet
        visible={activeCellIndex !== null}
        showRemove={activeCellIndex !== null && Boolean(normalizedCells[activeCellIndex]?.uri)}
        onCameraPress={() => openImagePicker('camera')}
        onLibraryPress={() => openImagePicker('library')}
        onRemovePress={removeActivePhoto}
        onClose={closeSheet}
      />
    </>
  );
};

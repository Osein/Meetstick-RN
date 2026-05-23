import * as ImagePicker from 'expo-image-picker';
import {SaveFormat, manipulateAsync} from 'expo-image-manipulator';

export type PhotoPickerSource = 'camera' | 'library';

type PickPhotoResult =
  | {status: 'success'; uri: string}
  | {status: 'cancelled'}
  | {status: 'permission_denied'; message: string};

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1
};

const cropToCenteredSquare = async (uri: string) => {
  const normalized = await manipulateAsync(uri, [], {
    compress: 1,
    format: SaveFormat.JPEG
  });

  const size = Math.min(normalized.width, normalized.height);
  const originX = Math.max(0, Math.floor((normalized.width - size) / 2));
  const originY = Math.max(0, Math.floor((normalized.height - size) / 2));

  const cropped = await manipulateAsync(
    normalized.uri,
    [
      {
        crop: {
          originX,
          originY,
          width: size,
          height: size
        }
      }
    ],
    {
      compress: 1,
      format: SaveFormat.JPEG
    }
  );

  return cropped.uri;
};

export const pickPhoto = async (source: PhotoPickerSource): Promise<PickPhotoResult> => {
  if (source === 'library') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return {
        status: 'permission_denied',
        message: 'Fotoğraf seçebilmek için galeri izni vermen gerekiyor.'
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (result.canceled || result.assets.length === 0) {
      return {status: 'cancelled'};
    }

    return {status: 'success', uri: await cropToCenteredSquare(result.assets[0].uri)};
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return {
      status: 'permission_denied',
      message: 'Fotoğraf çekebilmek için kamera izni vermen gerekiyor.'
    };
  }

  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled || result.assets.length === 0) {
    return {status: 'cancelled'};
  }

  return {status: 'success', uri: await cropToCenteredSquare(result.assets[0].uri)};
};

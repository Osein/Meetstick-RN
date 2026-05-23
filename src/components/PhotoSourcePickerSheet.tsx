import React from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import {palette} from '@/theme/colors';

type PhotoSourcePickerSheetProps = {
  visible: boolean;
  title?: string;
  libraryLabel?: string;
  showRemove?: boolean;
  onCameraPress: () => void;
  onLibraryPress: () => void;
  onRemovePress?: () => void;
  onClose: () => void;
};

export const PhotoSourcePickerSheet: React.FC<PhotoSourcePickerSheetProps> = ({
  visible,
  title = 'Fotoğraf Seçimi',
  libraryLabel = 'Galeriden Seç',
  showRemove = false,
  onCameraPress,
  onLibraryPress,
  onRemovePress,
  onClose
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, justifyContent: 'flex-end'}}>
        <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.28)'}} onPress={onClose} />
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
            {title}
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
                onPress={onCameraPress}
                style={{
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{fontSize: 18, color: '#007AFF'}}>Kamera ile Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onLibraryPress}
                style={{
                  height: 52,
                  borderTopWidth: 1,
                  borderTopColor: '#ECECEC',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{fontSize: 18, color: '#007AFF'}}>{libraryLabel}</Text>
              </TouchableOpacity>

              {showRemove && onRemovePress ? (
                <TouchableOpacity
                  onPress={onRemovePress}
                  style={{
                    height: 52,
                    borderTopWidth: 1,
                    borderTopColor: '#ECECEC',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{fontSize: 18, color: '#FF3B30'}}>Fotoğrafı Kaldır</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: 10,
                height: 52,
                borderRadius: 14,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{fontSize: 18, color: '#007AFF', fontWeight: '600'}}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

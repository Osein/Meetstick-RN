import React from 'react';
import {Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {palette} from '@/theme/colors';

type TimePickerBottomSheetProps = {
  visible: boolean;
  value: Date;
  title?: string;
  onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export const TimePickerBottomSheet: React.FC<TimePickerBottomSheetProps> = ({
  visible,
  value,
  title = 'Saat seç',
  onChange,
  onClose,
  onConfirm
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <View style={styles.pickerWrap}>
            <DateTimePicker
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              value={value}
              accentColor={palette.primary}
              onChange={onChange}
              style={styles.picker}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity activeOpacity={0.85} style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton} onPress={onConfirm}>
              <Text style={styles.primaryButtonText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 16
  },
  title: {
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12
  },
  pickerWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  picker: {
    alignSelf: 'center'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#78716C',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16
  }
});

import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle} from 'react-native';
import {palette} from '@/theme/colors';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export const PrimaryButton: React.FC<ButtonProps> = ({label, onPress, disabled, loading, style}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {backgroundColor: disabled ? palette.muted : palette.primary},
        style
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryLabel}>{label}</Text>}
    </TouchableOpacity>
  );
};

export const OutlinedButton: React.FC<ButtonProps> = ({label, onPress, disabled, style}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        styles.outlined,
        {borderColor: disabled ? palette.muted : palette.textSecondary},
        style
      ]}
    >
      <Text style={[styles.primaryLabel, {color: palette.textSecondary}]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  outlined: {
    backgroundColor: '#fff',
    borderWidth: 1
  }
});

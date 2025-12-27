import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {palette} from '@/theme/colors';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export const Chip: React.FC<Props> = ({label, selected, onPress}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {backgroundColor: selected ? palette.primary : '#fff', borderColor: palette.border}
      ]}
    >
      <Text style={[styles.label, {color: selected ? '#fff' : palette.textPrimary}]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1
  },
  label: {
    fontSize: 14,
    fontWeight: '500'
  }
});

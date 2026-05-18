import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {palette} from '@/theme/colors';

type Props = {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  onTitlePress?: () => void;
  showBottomBorder?: boolean;
};

export const AppHeader: React.FC<Props> = ({title, onBack, rightElement, onTitlePress, showBottomBorder = true}) => {
  return (
    <View style={[styles.container, !showBottomBorder && styles.containerNoBorder]}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {onTitlePress ? (
        <TouchableOpacity onPress={onTitlePress} style={styles.titleButton} activeOpacity={0.8}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
        </TouchableOpacity>
      ) : (
        <Text style={styles.titleStandalone} numberOfLines={1}>
          {title}
        </Text>
      )}
      <View style={styles.right}>{rightElement}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border
  },
  containerNoBorder: {
    borderBottomWidth: 0
  },
  left: {width: 42, justifyContent: 'center'},
  right: {width: 42, alignItems: 'flex-end'},
  titleButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary
  },
  titleStandalone: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary
  },
  iconButton: {
    padding: 6,
    borderRadius: 12
  }
});

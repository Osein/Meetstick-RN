import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, ViewProps} from 'react-native';
import {palette} from '@/theme/colors';

type Props = ViewProps & {
  background?: string;
  children: React.ReactNode;
};

export const Screen: React.FC<Props> = ({style, background = palette.surface, children, ...rest}) => {
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: background}, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

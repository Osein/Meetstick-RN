import React from 'react';
import {Keyboard, Pressable, StyleProp, ViewStyle} from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const KeyboardDismissView: React.FC<Props> = ({children, style}) => {
  return (
    <Pressable onPress={Keyboard.dismiss} style={style}>
      {children}
    </Pressable>
  );
};

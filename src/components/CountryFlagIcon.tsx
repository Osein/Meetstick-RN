import React from 'react';
import {Text} from 'react-native';
import {CountryCode} from 'libphonenumber-js';
import {getCountryFlagEmoji} from '@/utils/countries';

type Props = {
  code: CountryCode;
  size?: number;
  marginRight?: number;
};

export const CountryFlagIcon: React.FC<Props> = ({code, size = 18, marginRight = 10}) => {
  const emoji = getCountryFlagEmoji(code);

  return (
    <Text style={{fontSize: size, lineHeight: size + 1, marginRight}}>{emoji}</Text>
  );
};

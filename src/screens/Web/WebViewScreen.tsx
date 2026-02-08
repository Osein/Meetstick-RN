import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {View} from 'react-native';
import WebView from 'react-native-webview';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'WebView'>;

export const WebViewScreen: React.FC<Props> = ({navigation, route}) => {
  const {title, url} = route.params;
  return (
    <Screen background={palette.surface}>
      <AppHeader title={title} onBack={() => navigation.goBack()} />
      <View style={{flex: 1}}>
        <WebView source={{uri: url}} />
      </View>
    </Screen>
  );
};

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
  const {title, url, htmlContent} = route.params;
  const source = htmlContent ? {html: htmlContent} : {uri: url ?? 'about:blank'};

  return (
    <Screen background={palette.surface}>
      <AppHeader title={title} onBack={() => navigation.goBack()} />
      <View style={{flex: 1}}>
        <WebView source={source} />
      </View>
    </Screen>
  );
};

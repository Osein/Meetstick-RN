import 'react-native-gesture-handler';
import React, {useCallback, useEffect, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Toasts} from '@backpackapp-io/react-native-toast';
import {AppNavigator} from '@/navigation/AppNavigator';
import {AppProvider} from '@/context/AppContext';
import {SplashService} from '@/services/splash/splashService';
import {OnboardingImageKey} from '@/config/AppConfigContainer';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 250,
  fade: true,
});

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [rootReady, setRootReady] = useState(false);

  useEffect(() => {
    const splashService = new SplashService();
    const onboardingKeys: OnboardingImageKey[] = ['discover', 'communities', 'match'];

    const loadStartupData = async () => {
      try {
        await splashService.fetchOnboardingImageUrls(onboardingKeys);
      } finally {
        setAppReady(true);
      }
    };

    loadStartupData();
  }, []);

  useEffect(() => {
    if (appReady && rootReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady, rootReady]);

  const onLayoutRootView = useCallback(() => {
    setRootReady(true);
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}} onLayout={onLayoutRootView}>
      {appReady ? (
        <SafeAreaProvider>
          <KeyboardProvider>
            <AppProvider>
              <StatusBar style="dark" />
              <AppNavigator />
              <Toasts />
            </AppProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      ) : null}
    </GestureHandlerRootView>
  );
}

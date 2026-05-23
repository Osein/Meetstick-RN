import 'react-native-gesture-handler';
import React, {useCallback, useEffect, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Toasts} from '@backpackapp-io/react-native-toast';
import * as SecureStore from 'expo-secure-store';
import {AppNavigator} from '@/navigation/AppNavigator';
import {AppProvider} from '@/context/AppContext';
import {LoadingProvider} from '@/context/LoadingContext';
import {SplashService} from '@/services/splash/splashService';
import {OnboardingImageKey} from '@/config/AppConfigContainer';
import {MeetstickSecureKeyValueStorage} from '@/services/storage/MeetstickSecureKeyValueStorage';
import {LegalAgreement, User} from '@/types';
import {mapVerifiedProfileToUser} from '@/services/auth/authMappers';

const MEETSTICK_USER_ID_KEY = 'meetstick_user_id';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 250,
  fade: true,
});

const createUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const ensureMeetstickUserId = async () => {
  const existing = await SecureStore.getItemAsync(MEETSTICK_USER_ID_KEY);
  if (existing && existing.trim().length > 0) {
    return;
  }

  await SecureStore.setItemAsync(MEETSTICK_USER_ID_KEY, createUuid());
};

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [rootReady, setRootReady] = useState(false);
  const [initialUser, setInitialUser] = useState<User | undefined>(undefined);
  const [initialLegalAgreements, setInitialLegalAgreements] = useState<LegalAgreement[]>([]);

  useEffect(() => {
    const splashService = new SplashService();
    const secureKeyValueStorage = new MeetstickSecureKeyValueStorage();
    const onboardingKeys: OnboardingImageKey[] = ['discover', 'communities', 'match'];

    const loadStartupData = async () => {
      try {
        await ensureMeetstickUserId();
        const savedProfile = await secureKeyValueStorage.getUserProfile();
        const startupPayload = await splashService.fetchStartupPayload({
          onboardingKeys,
          accessToken: savedProfile?.accessToken
        });

        setInitialLegalAgreements(startupPayload.legalAgreements);

        if (startupPayload.userProfile) {
          await secureKeyValueStorage.saveUserProfile(startupPayload.userProfile);
          setInitialUser(mapVerifiedProfileToUser(startupPayload.userProfile));
        } else if (savedProfile?.accessToken && startupPayload.hasUserFieldInSplash) {
          await secureKeyValueStorage.clearUserProfile();
          setInitialUser(undefined);
        } else if (savedProfile) {
          setInitialUser(mapVerifiedProfileToUser(savedProfile));
        }
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
            <AppProvider initialUser={initialUser} initialLegalAgreements={initialLegalAgreements}>
              <LoadingProvider>
                <StatusBar style="dark" />
                <AppNavigator />
                <Toasts />
              </LoadingProvider>
            </AppProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      ) : null}
    </GestureHandlerRootView>
  );
}

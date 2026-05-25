import React, {useEffect, useMemo, useRef} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/navigation/types';
import {OnboardingScreen} from '@/screens/Onboarding/OnboardingScreen';
import {LoginScreen} from '@/screens/Auth/LoginScreen';
import {CountryPickerScreen} from '@/screens/Auth/CountryPickerScreen';
import {OtpScreen} from '@/screens/Auth/OtpScreen';
import {WelcomeScreen} from '@/screens/Auth/WelcomeScreen';
import {RegisterInfoScreen} from '@/screens/Register/RegisterInfoScreen';
import {RegisterDescriptionScreen} from '@/screens/Register/RegisterDescriptionScreen';
import {RegisterInterestsScreen} from '@/screens/Register/RegisterInterestsScreen';
import {RegisterPhotosScreen} from '@/screens/Register/RegisterPhotosScreen';
import {MainTabs} from '@/navigation/MainTabs';
import {EventListScreen} from '@/screens/Events/EventListScreen';
import {EventDetailScreen} from '@/screens/Events/EventDetailScreen';
import {InterestMeetingsScreen} from '@/screens/Discover/InterestMeetingsScreen';
import {PersonDetailScreen} from '@/screens/Person/PersonDetailScreen';
import {LocationSettingsScreen} from '@/screens/Profile/LocationSettingsScreen';
import {AgreementsScreen} from '@/screens/Profile/AgreementsScreen';
import {ContactUsScreen} from '@/screens/Profile/ContactUsScreen';
import {DeleteAccountScreen} from '@/screens/Profile/DeleteAccountScreen';
import {DeleteAccountOtpScreen} from '@/screens/Profile/DeleteAccountOtpScreen';
import {SettingsScreen} from '@/screens/Profile/SettingsScreen';
import {EditProfilePhotosScreen} from '@/screens/Profile/EditProfilePhotosScreen';
import {ChatRoomScreen} from '@/screens/Messages/ChatRoomScreen';
import {ChatEventInfoScreen} from '@/screens/Messages/ChatEventInfoScreen';
import {WebViewScreen} from '@/screens/Web/WebViewScreen';
import {NewMeetingDetailsScreen} from '@/screens/NewMeeting/NewMeetingDetailsScreen';
import {NewMeetingSelectInterestScreen} from '@/screens/NewMeeting/NewMeetingSelectInterestScreen';
import {NewMeetingLocationScreen} from '@/screens/NewMeeting/NewMeetingLocationScreen';
import {NewMeetingLocationSearchScreen} from '@/screens/NewMeeting/NewMeetingLocationSearchScreen';
import {useAppContext} from '@/context/AppContext';
import {resetSessionExpired, subscribeSessionExpired} from '@/services/auth/authSessionService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const {state, logout} = useAppContext();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const startRoute = useMemo(() => {
    if (!state.onboardingComplete) return 'Onboarding';
    if (!state.user) return 'Login';
    return 'MainTabs';
  }, [state.onboardingComplete, state.user]);

  useEffect(() => {
    const unsubscribe = subscribeSessionExpired(() => {
      logout();
      navigationRef.current?.resetRoot({
        index: 0,
        routes: [{name: 'Login'}]
      });
    });

    return unsubscribe;
  }, [logout]);

  useEffect(() => {
    if (!state.user?.accessToken) {
      resetSessionExpired();
    }
  }, [state.user?.accessToken]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={startRoute as keyof RootStackParamList}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CountryPicker" component={CountryPickerScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
        <Stack.Screen name="RegisterDescription" component={RegisterDescriptionScreen} />
        <Stack.Screen name="RegisterInterests" component={RegisterInterestsScreen} />
        <Stack.Screen name="RegisterPhotos" component={RegisterPhotosScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="EventList" component={EventListScreen} />
        <Stack.Screen name="InterestMeetings" component={InterestMeetingsScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
        <Stack.Screen name="LocationSettings" component={LocationSettingsScreen} />
        <Stack.Screen name="Agreements" component={AgreementsScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditProfilePhotos" component={EditProfilePhotosScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="ChatEventInfo" component={ChatEventInfoScreen} />
        <Stack.Screen name="DeleteAccountOtp" component={DeleteAccountOtpScreen} />
        <Stack.Screen name="WebView" component={WebViewScreen} />
        <Stack.Screen name="NewMeetingDetails" component={NewMeetingDetailsScreen} />
        <Stack.Screen name="NewMeetingSelectInterest" component={NewMeetingSelectInterestScreen} />
        <Stack.Screen name="NewMeetingLocation" component={NewMeetingLocationScreen} />
        <Stack.Screen name="NewMeetingLocationSearch" component={NewMeetingLocationSearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

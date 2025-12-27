import React, {useEffect, useMemo} from 'react';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/navigation/types';
import {OnboardingScreen} from '@/screens/Onboarding/OnboardingScreen';
import {LoginScreen} from '@/screens/Auth/LoginScreen';
import {OtpScreen} from '@/screens/Auth/OtpScreen';
import {WelcomeScreen} from '@/screens/Auth/WelcomeScreen';
import {RegisterInfoScreen} from '@/screens/Register/RegisterInfoScreen';
import {RegisterDescriptionScreen} from '@/screens/Register/RegisterDescriptionScreen';
import {RegisterInterestsScreen} from '@/screens/Register/RegisterInterestsScreen';
import {RegisterPhotosScreen} from '@/screens/Register/RegisterPhotosScreen';
import {MainTabs} from '@/navigation/MainTabs';
import {EventListScreen} from '@/screens/Events/EventListScreen';
import {EventDetailScreen} from '@/screens/Events/EventDetailScreen';
import {PersonDetailScreen} from '@/screens/Person/PersonDetailScreen';
import {NotificationSettingsScreen} from '@/screens/Profile/NotificationSettingsScreen';
import {LocationSettingsScreen} from '@/screens/Profile/LocationSettingsScreen';
import {AgreementsScreen} from '@/screens/Profile/AgreementsScreen';
import {ContactUsScreen} from '@/screens/Profile/ContactUsScreen';
import {DeleteAccountScreen} from '@/screens/Profile/DeleteAccountScreen';
import {WebViewScreen} from '@/screens/Web/WebViewScreen';
import {NewMeetingDetailsScreen} from '@/screens/NewMeeting/NewMeetingDetailsScreen';
import {NewMeetingLocationScreen} from '@/screens/NewMeeting/NewMeetingLocationScreen';
import {NewMeetingPhotosScreen} from '@/screens/NewMeeting/NewMeetingPhotosScreen';
import {useAppContext} from '@/context/AppContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const {state} = useAppContext();

  const startRoute = useMemo(() => {
    if (!state.onboardingComplete) return 'Onboarding';
    if (!state.user) return 'Login';
    return 'MainTabs';
  }, [state.onboardingComplete, state.user]);

  useEffect(() => {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{name: startRoute as keyof RootStackParamList}]
      });
    }
  }, [startRoute]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={startRoute as keyof RootStackParamList}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
        <Stack.Screen name="RegisterDescription" component={RegisterDescriptionScreen} />
        <Stack.Screen name="RegisterInterests" component={RegisterInterestsScreen} />
        <Stack.Screen name="RegisterPhotos" component={RegisterPhotosScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="EventList" component={EventListScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="LocationSettings" component={LocationSettingsScreen} />
        <Stack.Screen name="Agreements" component={AgreementsScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="WebView" component={WebViewScreen} />
        <Stack.Screen name="NewMeetingDetails" component={NewMeetingDetailsScreen} />
        <Stack.Screen name="NewMeetingLocation" component={NewMeetingLocationScreen} />
        <Stack.Screen name="NewMeetingPhotos" component={NewMeetingPhotosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

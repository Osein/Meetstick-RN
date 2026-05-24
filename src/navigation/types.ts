import {CountryCode} from 'libphonenumber-js';
import {DeleteAccountReason} from '@/services/auth/authService';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: {selectedCountry?: CountryCode} | undefined;
  CountryPicker: undefined;
  Otp: {otpId: string; phoneNumber: string; displayPhoneNumber: string; otpEndTime: number};
  Welcome: {registrationToken: string};
  RegisterInfo: {registrationToken: string};
  RegisterDescription: {registrationToken: string};
  RegisterInterests: {registrationToken: string};
  RegisterPhotos: {registrationToken: string};
  MainTabs: undefined;
  EventList: {categoryId: number; categoryTitle: string};
  EventDetail: {eventId: string};
  PersonDetail: {personId: string};
  LocationSettings: undefined;
  Agreements: undefined;
  ContactUs: undefined;
  DeleteAccount: undefined;
  Settings: undefined;
  ChatRoom: {eventId: string; title: string};
  ChatEventInfo: {eventId: string; title: string; fromChat?: boolean};
  DeleteAccountOtp: {
    otpId: string;
    phoneNumber: string;
    otpEndTime: number;
    reason: DeleteAccountReason;
    reasonNote?: string;
  };
  WebView: {title: string; url?: string; htmlContent?: string};
  NewMeetingDetails: undefined;
  NewMeetingSelectInterest: undefined;
  NewMeetingLocation:
    | {
        focusedPlace?: {
          placeId?: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
        };
      }
    | undefined;
  NewMeetingLocationSearch:
    | {
        lat?: number;
        lng?: number;
      }
    | undefined;
  EditProfilePhotos: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  CategoriesTab: undefined;
  NewMeetingTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

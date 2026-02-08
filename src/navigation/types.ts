import {CountryCode} from 'libphonenumber-js';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: {selectedCountry?: CountryCode} | undefined;
  CountryPicker: undefined;
  Otp: {phoneNumber: string; displayPhoneNumber: string; otpEndTime: number};
  Welcome: {registrationToken: string};
  RegisterInfo: undefined;
  RegisterDescription: undefined;
  RegisterInterests: undefined;
  RegisterPhotos: undefined;
  MainTabs: undefined;
  EventList: {categoryId: number; categoryTitle: string};
  EventDetail: {eventId: string};
  PersonDetail: {personId: string};
  LocationSettings: undefined;
  Agreements: undefined;
  ContactUs: undefined;
  DeleteAccount: undefined;
  WebView: {title: string; url: string};
  NewMeetingDetails: undefined;
  NewMeetingLocation: undefined;
  NewMeetingPhotos: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  CategoriesTab: undefined;
  NewMeetingTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Otp: {phoneNumber: string; otpEndTime: number};
  Welcome: {registrationToken: string};
  RegisterInfo: undefined;
  RegisterDescription: undefined;
  RegisterInterests: undefined;
  RegisterPhotos: undefined;
  MainTabs: undefined;
  EventList: {categoryId: number; categoryTitle: string};
  EventDetail: {eventId: string};
  PersonDetail: {personId: string};
  NotificationSettings: undefined;
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

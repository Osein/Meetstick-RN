import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {NewMeetingDraft, NotificationSettings, RegisterDraft, User} from '@/types';

type AppState = {
  onboardingComplete: boolean;
  user?: User;
  registerDraft: RegisterDraft;
  notificationSettings: NotificationSettings;
  locationDistanceKm: number;
  newMeetingDraft: NewMeetingDraft;
};

type AppContextValue = {
  state: AppState;
  completeOnboarding: () => void;
  loginWithPhone: (phone: string) => void;
  completeRegistration: (draftOverride?: Partial<RegisterDraft>) => void;
  updateRegisterDraft: (draft: Partial<RegisterDraft>) => void;
  updateMeetingDraft: (draft: Partial<NewMeetingDraft>) => void;
  resetMeetingDraft: () => void;
  logout: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateLocationDistance: (distance: number) => void;
};

const defaultRegisterDraft: RegisterDraft = {
  name: '',
  interests: [],
  photos: []
};

const defaultNotificationSettings: NotificationSettings = {
  newVersionEnabled: true,
  messagingEnabled: true,
  featuredEventsEnabled: true
};

const defaultMeetingDraft: NewMeetingDraft = {
  title: '',
  participantCount: '',
  description: '',
  photos: []
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, setState] = useState<AppState>({
    onboardingComplete: false,
    user: undefined,
    registerDraft: defaultRegisterDraft,
    notificationSettings: defaultNotificationSettings,
    locationDistanceKm: 25,
    newMeetingDraft: defaultMeetingDraft
  });

  const completeOnboarding = useCallback(() => {
    setState(prev => ({...prev, onboardingComplete: true}));
  }, []);

  const loginWithPhone = useCallback((phone: string) => {
    // Mock login: set a lightweight user placeholder
    setState(prev => ({
      ...prev,
      user: {
        id: 'user-1',
        name: prev.registerDraft.name || 'Meetstick User',
        phoneNumber: phone,
        interests: prev.registerDraft.interests,
        photos: prev.registerDraft.photos,
        bio: prev.registerDraft.bio,
        birthDate: prev.registerDraft.birthDate,
        gender: prev.registerDraft.gender
      }
    }));
  }, []);

  const completeRegistration = useCallback((draftOverride?: Partial<RegisterDraft>) => {
    setState(prev => {
      const draft = {...prev.registerDraft, ...draftOverride};
      return {
        ...prev,
        user: {
          id: 'user-registered',
          name: draft.name || 'Meetstick User',
          interests: draft.interests,
          photos: draft.photos,
          bio: draft.bio,
          birthDate: draft.birthDate,
          gender: draft.gender,
          isVerified: false
        },
        registerDraft: draft
      };
    });
  }, []);

  const updateRegisterDraft = useCallback((draft: Partial<RegisterDraft>) => {
    setState(prev => ({
      ...prev,
      registerDraft: {...prev.registerDraft, ...draft}
    }));
  }, []);

  const updateMeetingDraft = useCallback((draft: Partial<NewMeetingDraft>) => {
    setState(prev => ({
      ...prev,
      newMeetingDraft: {...prev.newMeetingDraft, ...draft}
    }));
  }, []);

  const resetMeetingDraft = useCallback(() => {
    setState(prev => ({...prev, newMeetingDraft: defaultMeetingDraft}));
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({
      ...prev,
      user: undefined
    }));
  }, []);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setState(prev => ({
      ...prev,
      notificationSettings: {...prev.notificationSettings, ...settings}
    }));
  }, []);

  const updateLocationDistance = useCallback((distance: number) => {
    setState(prev => ({
      ...prev,
      locationDistanceKm: distance
    }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      completeOnboarding,
      loginWithPhone,
      completeRegistration,
      updateRegisterDraft,
      updateMeetingDraft,
      resetMeetingDraft,
      logout,
      updateNotificationSettings,
      updateLocationDistance
    }),
    [
      state,
      completeOnboarding,
      loginWithPhone,
      completeRegistration,
      updateRegisterDraft,
      logout,
      updateNotificationSettings,
      updateLocationDistance,
      updateMeetingDraft,
      resetMeetingDraft
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};

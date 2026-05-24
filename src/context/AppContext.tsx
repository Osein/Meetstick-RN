import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {LegalAgreement, NewMeetingDraft, RegisterDraft, User} from '@/types';
import {VerifyOtpResponse} from '@/services/auth/authService';
import {MeetstickSecureKeyValueStorage} from '@/services/storage/MeetstickSecureKeyValueStorage';
import {mapVerifiedProfileToUser} from '@/services/auth/authMappers';

type AppState = {
  onboardingComplete: boolean;
  user?: User;
  legalAgreements: LegalAgreement[];
  registerDraft: RegisterDraft;
  newMeetingDraft: NewMeetingDraft;
};

type AppContextValue = {
  state: AppState;
  completeOnboarding: () => void;
  loginWithPhone: (phone: string) => void;
  setAuthenticatedUser: (user: User) => void;
  completeLoginWithVerifiedProfile: (profile: VerifyOtpResponse) => Promise<void>;
  completeRegistration: (draftOverride?: Partial<RegisterDraft>) => void;
  updateRegisterDraft: (draft: Partial<RegisterDraft>) => void;
  updateMeetingDraft: (draft: Partial<NewMeetingDraft>) => void;
  resetMeetingDraft: () => void;
  logout: () => void;
  updateLocationDistance: (distance: number) => Promise<void>;
};

const defaultRegisterDraft: RegisterDraft = {
  name: '',
  interests: [],
  photos: []
};

const defaultMeetingDraft: NewMeetingDraft = {
  title: '',
  participantCount: '',
  description: '',
  interests: [],
  autoApproveParticipants: false,
  createChatRoom: true,
  isFutureEvent: false,
  isAllDayEvent: false,
  photos: []
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialUser?: User;
  initialLegalAgreements?: LegalAgreement[];
}> = ({
  children,
  initialUser,
  initialLegalAgreements = []
}) => {
  const secureStorage = useMemo(() => new MeetstickSecureKeyValueStorage(), []);
  const [state, setState] = useState<AppState>({
    onboardingComplete: Boolean(initialUser),
    user: initialUser,
    legalAgreements: initialLegalAgreements,
    registerDraft: defaultRegisterDraft,
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

  const setAuthenticatedUser = useCallback((user: User) => {
    setState(prev => ({
      ...prev,
      onboardingComplete: true,
      user
    }));
  }, []);

  const completeLoginWithVerifiedProfile = useCallback(
    async (profile: VerifyOtpResponse) => {
      await secureStorage.saveUserProfile(profile);
      const mappedUser = mapVerifiedProfileToUser(profile);
      setState(prev => ({
        ...prev,
        onboardingComplete: true,
        user: mappedUser
      }));
    },
    [secureStorage]
  );

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
    secureStorage.clearUserProfile().catch(() => undefined);
    setState(prev => ({
      ...prev,
      user: undefined
    }));
  }, [secureStorage]);

  const updateLocationDistance = useCallback(async (distance: number) => {
    await secureStorage.updateUserProfile({locationDistance: distance});
    setState(prev => ({
      ...prev,
      user: prev.user
        ? {
            ...prev.user,
            locationDistance: distance
          }
        : prev.user
    }));
  }, [secureStorage]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      completeOnboarding,
      loginWithPhone,
      setAuthenticatedUser,
      completeLoginWithVerifiedProfile,
      completeRegistration,
      updateRegisterDraft,
      updateMeetingDraft,
      resetMeetingDraft,
      logout,
      updateLocationDistance
    }),
    [
      state,
      completeOnboarding,
      loginWithPhone,
      setAuthenticatedUser,
      completeLoginWithVerifiedProfile,
      completeRegistration,
      updateRegisterDraft,
      logout,
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

export const useCurrentUser = (): User | undefined => {
  return useAppContext().state.user;
};

export const useRequiredUser = (): User => {
  const user = useCurrentUser();
  if (!user) {
    throw new Error('useRequiredUser called without an authenticated user');
  }
  return user;
};

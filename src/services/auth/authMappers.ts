import {VerifyOtpResponse} from '@/services/auth/authService';
import {User} from '@/types';

export const mapVerifiedProfileToUser = (profile: VerifyOtpResponse): User => {
  return {
    id: profile.phoneNumber || profile.email || 'user',
    name: profile.name || 'Meetstick User',
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    birthDate: profile.birthDate,
    gender: profile.gender,
    level: profile.level,
    accessToken: profile.accessToken,
    interests: profile.interests || [],
    photos: (profile.photos || []).map(photo => photo.photoUrl),
    isVerified: true
  };
};


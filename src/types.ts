export type Interest = {
  id: number;
  title: string;
};

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type Person = {
  id: string;
  name: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  photos: string[];
  gender?: Gender;
  age?: number;
  bio?: string;
  interests: Interest[];
};

export type ParticipantRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type ParticipantRequest = {
  id: string;
  person: Person;
  requestedAt: string;
  status: ParticipantRequestStatus;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  photos: string[];
  poster: Person;
  dateTime: string;
  location: string;
  attendeeCount: number;
  categoryId: number;
  categoryName: string;
  isJoined: boolean;
  hasRequestedToJoin: boolean;
  ownerId: number;
  participantRequests: ParticipantRequest[];
};

export type EventCategory = {
  id: number;
  title: string;
  isFavorite?: boolean;
  eventCount?: number;
};

export type Meeting = {
  id: string;
  title: string;
  featuredImageUrl: string;
  poster: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  dateTime: string;
  location: string;
  attendeeCount: number;
};

export type NotificationSettings = {
  newVersionEnabled: boolean;
  messagingEnabled: boolean;
  featuredEventsEnabled: boolean;
};

export type ContactTopic = {
  id: string;
  displayName: string;
};

export type DeleteReason = {
  id: string;
  displayName: string;
  requiresDetail?: boolean;
};

export type User = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: Gender;
  bio?: string;
  interests: Interest[];
  photos: string[];
  isVerified?: boolean;
};

export type RegisterDraft = {
  name: string;
  birthDate?: string;
  gender?: Gender;
  bio?: string;
  interests: Interest[];
  photos: string[];
};

export type NewMeetingDraft = {
  title: string;
  participantCount: string;
  description: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
};

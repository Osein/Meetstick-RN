import {ContactTopic, DeleteReason, Event, EventCategory, Interest, Meeting, NotificationSettings, Person} from '@/types';

export const interests: Interest[] = [
  {id: 1, title: 'Futbol'},
  {id: 2, title: 'Basketbol'},
  {id: 3, title: 'Konser'},
  {id: 4, title: 'Paintball'},
  {id: 5, title: 'Tiyatro'},
  {id: 6, title: 'Sinema'},
  {id: 7, title: 'İtalyan Mutfağı'},
  {id: 8, title: 'Kayak'},
  {id: 9, title: 'Bisiklet'},
  {id: 10, title: 'Yürüyüş'},
  {id: 11, title: 'Dağ Yürüyüşü'}
];

export const categories: EventCategory[] = [
  {id: 1, title: 'Teknoloji', isFavorite: true, eventCount: 24},
  {id: 2, title: 'Spor', isFavorite: true, eventCount: 18},
  {id: 3, title: 'Müzik', isFavorite: false, eventCount: 31},
  {id: 4, title: 'Sanat', isFavorite: false, eventCount: 12},
  {id: 5, title: 'Yemek', isFavorite: true, eventCount: 22},
  {id: 6, title: 'Eğitim', isFavorite: false, eventCount: 15},
  {id: 7, title: 'İş & Kariyer', isFavorite: false, eventCount: 9},
  {id: 8, title: 'Sağlık & Fitness', isFavorite: false, eventCount: 27},
  {id: 9, title: 'Fotoğrafçılık', isFavorite: false, eventCount: 14},
  {id: 10, title: 'Seyahat', isFavorite: false, eventCount: 19},
  {id: 11, title: 'Oyun', isFavorite: false, eventCount: 16},
  {id: 12, title: 'Kitap & Edebiyat', isFavorite: false, eventCount: 8}
];

export const dashboardMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Tech Meetup Istanbul',
    featuredImageUrl: 'https://picsum.photos/400/200?random=1',
    poster: {id: 'user1', name: 'Ahmet Yılmaz', profileImageUrl: 'https://picsum.photos/100/100?random=10'},
    dateTime: new Date().toISOString(),
    location: 'Kadıköy, Istanbul',
    attendeeCount: 45
  },
  {
    id: '2',
    title: 'Startup Weekend',
    featuredImageUrl: 'https://picsum.photos/400/200?random=2',
    poster: {id: 'user2', name: 'Elif Kaya', profileImageUrl: 'https://picsum.photos/100/100?random=11'},
    dateTime: new Date().toISOString(),
    location: 'Beyoğlu, Istanbul',
    attendeeCount: 82
  },
  {
    id: '3',
    title: 'Coffee & Code',
    featuredImageUrl: 'https://picsum.photos/400/200?random=3',
    poster: {id: 'user3', name: 'Mehmet Öz', profileImageUrl: 'https://picsum.photos/100/100?random=12'},
    dateTime: new Date().toISOString(),
    location: 'Beşiktaş, Istanbul',
    attendeeCount: 23
  },
  {
    id: '4',
    title: 'Design Thinking Workshop',
    featuredImageUrl: 'https://picsum.photos/400/200?random=4',
    poster: {id: 'user4', name: 'Ayşe Demir', profileImageUrl: 'https://picsum.photos/100/100?random=13'},
    dateTime: new Date().toISOString(),
    location: 'Şişli, Istanbul',
    attendeeCount: 67
  },
  {
    id: '5',
    title: 'AI & Machine Learning',
    featuredImageUrl: 'https://picsum.photos/400/200?random=5',
    poster: {id: 'user5', name: 'Can Arslan', profileImageUrl: 'https://picsum.photos/100/100?random=14'},
    dateTime: new Date().toISOString(),
    location: 'Maslak, Istanbul',
    attendeeCount: 156
  },
  {
    id: '6',
    title: 'Photography Walk',
    featuredImageUrl: 'https://picsum.photos/400/200?random=6',
    poster: {id: 'user6', name: 'Zeynep Çelik', profileImageUrl: 'https://picsum.photos/100/100?random=15'},
    dateTime: new Date().toISOString(),
    location: 'Galata, Istanbul',
    attendeeCount: 34
  }
];

export const contactTopics: ContactTopic[] = [
  {id: 'product', displayName: 'Ürün İyileştirme'},
  {id: 'security', displayName: 'Güvenlik'},
  {id: 'support', displayName: 'Destek'},
  {id: 'other', displayName: 'Diğer'}
];

export const deleteReasons: DeleteReason[] = [
  {id: 'safety', displayName: 'Güvenlik endişesi'},
  {id: 'notUseful', displayName: 'Beklediğim gibi değil'},
  {id: 'bugs', displayName: 'Hatalarla karşılaşıyorum'},
  {id: 'privacy', displayName: 'Veri gizliliği nedeniyle', requiresDetail: true},
  {id: 'other', displayName: 'Diğer', requiresDetail: true}
];

const basePoster: Person = {
  id: '1',
  name: 'Mert Eroğlu',
  profileImageUrl: 'https://picsum.photos/100/100?random=10',
  isVerified: true,
  photos: [],
  interests: []
};

export const samplePerson: Person = {
  id: 'person-1',
  name: 'Tobias Welch',
  profileImageUrl: 'https://picsum.photos/400/600?random=1',
  isVerified: true,
  photos: [
    'https://picsum.photos/400/600?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/400/600?random=3',
    'https://picsum.photos/400/600?random=4'
  ],
  gender: 'MALE',
  age: 27,
  bio: 'Profesyonel tenis oyuncusu. Turnuvalar arasında yeni insanlarla tanışmak istiyorum.',
  interests
};

export const getEventsForCategory = (categoryId: number, categoryTitle: string): Event[] => {
  const baseEvents: Event[] = [
    {
      id: '1',
      title: `${categoryTitle} halısaha için 3 kişi arıyoruz`,
      description: 'Göztepe\'de halısaha maçı için takıma katılmak isteyen arkadaşlar arıyoruz.',
      photos: ['https://picsum.photos/400/300?random=1'],
      poster: {...basePoster, id: 'user1', name: 'Ali Argın'},
      dateTime: new Date().toISOString(),
      location: 'Cuma, Ekim 13',
      attendeeCount: 3,
      categoryId,
      categoryName: categoryTitle,
      isJoined: false,
      hasRequestedToJoin: false,
      ownerId: 1,
      participantRequests: []
    },
    {
      id: '2',
      title: `${categoryTitle} etkinliği için katılımcı arıyoruz`,
      description: 'Haftasonu yapılacak etkinlik için birlikte vakit geçirmek isteyenler.',
      photos: ['https://picsum.photos/400/300?random=2'],
      poster: {...basePoster, id: 'user2', name: 'Mehmet Yılmaz'},
      dateTime: new Date().toISOString(),
      location: 'Cumartesi, Ekim 14',
      attendeeCount: 7,
      categoryId,
      categoryName: categoryTitle,
      isJoined: false,
      hasRequestedToJoin: false,
      ownerId: 2,
      participantRequests: []
    },
    {
      id: '3',
      title: `${categoryTitle} grubu buluşması`,
      description: 'Düzenli olarak yapılan grup etkinliğimize yeni üyeler arıyoruz.',
      photos: ['https://picsum.photos/400/300?random=3'],
      poster: {...basePoster, id: 'user3', name: 'Ayşe Kaya'},
      dateTime: new Date().toISOString(),
      location: 'Pazar, Ekim 15',
      attendeeCount: 12,
      categoryId,
      categoryName: categoryTitle,
      isJoined: false,
      hasRequestedToJoin: false,
      ownerId: 3,
      participantRequests: []
    },
    {
      id: '4',
      title: `${categoryTitle} workshop etkinliği`,
      description: 'Başlangıç seviyesindeki kişiler için düzenlenen workshop etkinliği.',
      photos: ['https://picsum.photos/400/300?random=4'],
      poster: {...basePoster, id: 'user4', name: 'Can Özkan'},
      dateTime: new Date().toISOString(),
      location: 'Pazartesi, Ekim 16',
      attendeeCount: 5,
      categoryId,
      categoryName: categoryTitle,
      isJoined: false,
      hasRequestedToJoin: false,
      ownerId: 4,
      participantRequests: []
    },
    {
      id: '5',
      title: `${categoryTitle} turnuvası`,
      description: 'Aylık turnuvamıza katılmak isteyen tüm seviyelerden katılımcılar davetlidir.',
      photos: ['https://picsum.photos/400/300?random=5'],
      poster: {...basePoster, id: 'user5', name: 'Zeynep Demir'},
      dateTime: new Date().toISOString(),
      location: 'Salı, Ekim 17',
      attendeeCount: 18,
      categoryId,
      categoryName: categoryTitle,
      isJoined: false,
      hasRequestedToJoin: false,
      ownerId: 5,
      participantRequests: []
    }
  ];

  return baseEvents.map(event => ({...event, categoryId, categoryName: categoryTitle}));
};

export const getEventDetail = (eventId: string, currentUserId = 1): Event => {
  const isOwner = eventId === 'owner_event';
  const participantRequests = isOwner
    ? Array.from({length: 4}).map((_, index) => ({
        id: `${index + 1}`,
        person: {
          id: `user${index + 1}`,
          name: 'İlayda Ayaz',
          profileImageUrl: `https://picsum.photos/100/100?random=${11 + index}`,
          photos: [],
          interests: []
        },
        requestedAt: new Date().toISOString(),
        status: 'PENDING' as const
      }))
    : [];

  return {
    id: eventId,
    title: 'Tadım Etkinliği',
    description:
      'Caddebostanda restoran gezeceğiz. Bizimle takılacak muhabbeti iyi birini arıyoruz.\n\nSinopia Mantı Evi\'ne gidip ardından Köln Kafede kahve içip yürüyüş yaptıktan sonra dağılacağız.',
    photos: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3'
    ],
    poster: basePoster,
    dateTime: new Date().toISOString(),
    location: 'Caddebostan, Bağdat Cad. Sella Palas Apt No:271',
    attendeeCount: 5,
    categoryId: 1,
    categoryName: 'Yemek',
    isJoined: false,
    hasRequestedToJoin: !isOwner,
    ownerId: isOwner ? currentUserId : 2,
    participantRequests
  };
};

export const defaultNotificationSettings: NotificationSettings = {
  newVersionEnabled: true,
  messagingEnabled: true,
  featuredEventsEnabled: true
};

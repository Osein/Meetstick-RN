import {buildApiUrl} from '@/services/api/apiConfig';
import * as FileSystem from 'expo-file-system/legacy';

type ServiceErrorResponse = {
  messageId?: string;
  userDescription?: string;
  subErrors?: unknown;
  message?: string;
};

type ChatListApiItem = {
  eventId?: unknown;
  title?: unknown;
  coverPhoto?: unknown;
  lastMessage?: {
    text?: unknown;
    receivedAt?: unknown;
    sender?: {
      name?: unknown;
    };
  } | null;
};

export type ChatListItem = {
  eventId: string;
  title: string;
  coverPhoto?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSenderName?: string;
};

export type ChatMessageItem = {
  id: string;
  type: string;
  text?: string;
  photoUrl?: string;
  sentAt?: string;
  receivedAt?: string;
  senderName?: string;
  senderId?: string;
};

export type UploadChatMediaPayload = {
  eventId: string;
  fileUri: string;
  accessToken?: string;
  mimeType?: string;
  fileName?: string;
  onProgress?: (progress: number) => void;
};

export type UploadChatMediaResponse = {
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ServiceErrorResponse;

    if (typeof data.userDescription === 'string' && data.userDescription.trim().length > 0) {
      return data.userDescription;
    }

    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // noop
  }

  return 'Sohbet listesi alınamadı.';
};

const normalizeChatItem = (item: ChatListApiItem): ChatListItem | null => {
  const eventId =
    typeof item.eventId === 'string' ? item.eventId : item.eventId != null ? String(item.eventId) : '';
  const title = typeof item.title === 'string' ? item.title : item.title != null ? String(item.title) : '';

  if (!eventId || !title.trim()) {
    return null;
  }

  return {
    eventId,
    title: title.trim(),
    coverPhoto: typeof item.coverPhoto === 'string' ? item.coverPhoto : undefined,
    lastMessageText: typeof item.lastMessage?.text === 'string' ? item.lastMessage.text : undefined,
    lastMessageAt: typeof item.lastMessage?.receivedAt === 'string' ? item.lastMessage.receivedAt : undefined,
    lastMessageSenderName:
      typeof item.lastMessage?.sender?.name === 'string' ? item.lastMessage.sender.name : undefined
  };
};

export const getChatList = async (accessToken?: string): Promise<ChatListItem[]> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildApiUrl('/v1/chats'), {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map(item => normalizeChatItem(item as ChatListApiItem))
    .filter((item): item is ChatListItem => item !== null);
};

export const getChatMessages = async ({
  eventId,
  accessToken,
  cursor,
  limit = 30
}: {
  eventId: string;
  accessToken?: string;
  cursor?: string;
  limit?: number;
}): Promise<{items: ChatMessageItem[]; nextCursor?: string}> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const params = new URLSearchParams();
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const query = params.toString();
  const response = await fetch(
    buildApiUrl(`/v1/chats/${encodeURIComponent(eventId)}/messages${query ? `?${query}` : ''}`),
    {
      method: 'GET',
      headers
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: unknown;
      type?: unknown;
      text?: unknown;
      photoUrl?: unknown;
      sentAt?: unknown;
      receivedAt?: unknown;
      sender?: {id?: unknown; name?: unknown} | null;
    }>;
    nextCursor?: unknown;
  };

  const items: ChatMessageItem[] = Array.isArray(payload.items)
    ? payload.items
        .map((item): ChatMessageItem | null => {
          const id = typeof item.id === 'string' ? item.id : item.id != null ? String(item.id) : '';
          const type = typeof item.type === 'string' ? item.type : item.type != null ? String(item.type) : '';
          if (!id || !type) {
            return null;
          }

          return {
            id,
            type,
            text: typeof item.text === 'string' ? item.text : undefined,
            photoUrl: typeof item.photoUrl === 'string' ? item.photoUrl : undefined,
            sentAt: typeof item.sentAt === 'string' ? item.sentAt : undefined,
            receivedAt: typeof item.receivedAt === 'string' ? item.receivedAt : undefined,
            senderName: typeof item.sender?.name === 'string' ? item.sender.name : undefined,
            senderId: typeof item.sender?.id === 'string' ? item.sender.id : undefined
          };
        })
        .filter((item): item is ChatMessageItem => item !== null)
    : [];

  return {
    items,
    nextCursor: typeof payload.nextCursor === 'string' ? payload.nextCursor : undefined
  };
};

export const uploadChatMedia = async ({
  eventId,
  fileUri,
  accessToken,
  mimeType,
  fileName,
  onProgress
}: UploadChatMediaPayload): Promise<UploadChatMediaResponse> => {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const uploadTask = FileSystem.createUploadTask(
    buildApiUrl(`/v1/chats/${encodeURIComponent(eventId)}/media`),
    fileUri,
    {
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      httpMethod: 'POST',
      mimeType,
      parameters: {},
      headers
    },
    data => {
      const total = data.totalBytesExpectedToSend || 0;
      const sent = data.totalBytesSent || 0;
      if (total > 0 && onProgress) {
        onProgress(Math.min(1, Math.max(0, sent / total)));
      }
    }
  );

  const result = await uploadTask.uploadAsync();
  if (!result || result.status < 200 || result.status >= 300) {
    let message = 'Medya yüklenemedi.';
    try {
      const parsed = JSON.parse(result?.body || '{}') as ServiceErrorResponse;
      if (typeof parsed.userDescription === 'string' && parsed.userDescription.trim().length > 0) {
        message = parsed.userDescription;
      } else if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
        message = parsed.message;
      }
    } catch {
      // noop
    }
    throw new Error(message);
  }

  const parsed = JSON.parse(result.body || '{}') as {
    url?: unknown;
    mimeType?: unknown;
    sizeBytes?: unknown;
    width?: unknown;
    height?: unknown;
  };

  if (typeof parsed.url !== 'string' || parsed.url.trim().length === 0) {
    throw new Error('Medya yükleme yanıtı geçersiz.');
  }

  return {
    url: parsed.url,
    mimeType: typeof parsed.mimeType === 'string' ? parsed.mimeType : undefined,
    sizeBytes: typeof parsed.sizeBytes === 'number' ? parsed.sizeBytes : undefined,
    width: typeof parsed.width === 'number' ? parsed.width : undefined,
    height: typeof parsed.height === 'number' ? parsed.height : undefined
  };
};

export const sendChatMessage = async ({
  eventId,
  accessToken,
  type,
  text,
  photoUrl,
  sentAt
}: {
  eventId: string;
  accessToken?: string;
  type: 'text' | 'photo' | 'location' | 'vcard' | 'poll';
  text?: string;
  photoUrl?: string;
  sentAt?: string;
}): Promise<ChatMessageItem> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildApiUrl(`/v1/chats/${encodeURIComponent(eventId)}/messages`), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type,
      sentAt: sentAt ?? new Date().toISOString(),
      text,
      photoUrl
    })
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const item = (await response.json()) as {
    id?: unknown;
    type?: unknown;
    text?: unknown;
    photoUrl?: unknown;
    sentAt?: unknown;
    receivedAt?: unknown;
    sender?: {id?: unknown; name?: unknown} | null;
  };

  const id = typeof item.id === 'string' ? item.id : item.id != null ? String(item.id) : '';
  const normalizedType =
    typeof item.type === 'string' ? item.type : item.type != null ? String(item.type) : '';
  if (!id || !normalizedType) {
    throw new Error('Mesaj yanıtı geçersiz.');
  }

  return {
    id,
    type: normalizedType,
    text: typeof item.text === 'string' ? item.text : undefined,
    photoUrl: typeof item.photoUrl === 'string' ? item.photoUrl : undefined,
    sentAt: typeof item.sentAt === 'string' ? item.sentAt : undefined,
    receivedAt: typeof item.receivedAt === 'string' ? item.receivedAt : undefined,
    senderName: typeof item.sender?.name === 'string' ? item.sender.name : undefined,
    senderId: typeof item.sender?.id === 'string' ? item.sender.id : undefined
  };
};

export const markChatMessagesSeen = async ({
  eventId,
  cursorMessageId,
  accessToken
}: {
  eventId: string;
  cursorMessageId: string;
  accessToken?: string;
}): Promise<number> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildApiUrl(`/v1/chats/${encodeURIComponent(eventId)}/messages/seen`), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cursorMessageId
    })
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const payload = (await response.json()) as {updated?: unknown};
  return typeof payload.updated === 'number' ? payload.updated : 0;
};

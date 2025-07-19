export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Conversation {
  id: number;
  name?: string;
  type: 'direct' | 'group';
  participants: ConversationParticipant[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
  user: User;
  joinedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender: User;
  content: string;
  type: 'text' | 'voice' | 'file' | 'image';
  metadata?: any;
  encryptedContent?: string;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: number[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email?: string;
  password: string;
}

export interface WebSocketMessage {
  type: 'auth' | 'new_message' | 'typing' | 'auth_success' | 'auth_error';
  data?: any;
  token?: string;
  conversationId?: number;
  isTyping?: boolean;
}

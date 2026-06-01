export type UserRole = 'user' | 'counselor' | 'department_admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type PostStatus = 'draft' | 'published' | 'archived';
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  phone?: string;
  isEmailVerified: boolean;
  department?: { _id: string; name: string; slug: string; color: string; icon: string };
  assignedCounselor?: Counselor;
  specializations?: string[];
  qualifications?: string[];
  isAvailable?: boolean;
  rating?: number;
  sessionCount?: number;
  lastActive?: string;
  createdAt: string;
}

export interface Counselor {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  specializations?: string[];
  qualifications?: string[];
  rating?: number;
  sessionCount?: number;
  isAvailable?: boolean;
  department?: { _id: string; name: string; slug: string; color: string; icon: string };
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: { _id: string; name: string; avatar?: string; role: UserRole };
  status: PostStatus;
  tags: string[];
  category?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isAnonymous: boolean;
  allowComments: boolean;
  likes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: { _id: string; name: string; avatar?: string; role: UserRole };
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  parentComment?: string;
  likeCount: number;
  isAnonymous: boolean;
  replies?: Comment[];
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  headAdmin?: { _id: string; name: string };
  counselors?: Counselor[];
  isActive: boolean;
}

export interface Session {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  counselor: { _id: string; name: string; avatar?: string };
  status: SessionStatus;
  scheduledAt: string;
  duration?: number;
  notes?: string;
  meetingLink?: string;
  rating?: number;
  feedback?: string;
  cancelReason?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: { _id: string; name: string; avatar?: string; role: UserRole };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  user: { _id: string; name: string; avatar?: string; lastActive?: string };
  counselor: { _id: string; name: string; avatar?: string; isAvailable?: boolean };
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCountUser: number;
  unreadCountCounselor: number;
  isActive: boolean;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export type UserRole = 'user' | 'counselor' | 'department_admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type PostStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
export type PostVisibility = 'public' | 'private';
export type SessionStatus = 'pending' | 'approved' | 'scheduled' | 'active' | 'completed' | 'cancelled';

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
  isAuthor?: boolean;
  consecutiveApprovals?: number;
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
  author: { _id: string; name: string; avatar?: string; role: UserRole; isAuthor?: boolean };
  status: PostStatus;
  tags: string[];
  category?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isAnonymous: boolean;
  allowComments: boolean;
  autoPublished: boolean;
  visibility: PostVisibility;
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
  counselor?: { _id: string; name: string; avatar?: string };
  status: SessionStatus;
  requestedDate: string;
  scheduledAt?: string;
  duration?: number;
  description?: string;
  emotionalState?: string;
  preferredSupportType?: 'call' | 'chat' | 'follow-up';
  availability?: string;
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
  type?: 'support' | 'therapy';
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCountUser: number;
  unreadCountCounselor: number;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}

export interface LiteraryWork {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  author?: { _id: string; name: string; avatar?: string };
  authorName?: string;
  category?: string;
  coverImage?: string;
  downloadCount: number;
  isPublished: boolean;
  createdAt: string;
}

export interface Subscriber {
  _id: string;
  email: string;
  source?: string;
  createdAt: string;
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved';
export type ComplaintCategory = 'session' | 'counselor' | 'content' | 'technical' | 'other';

export interface Complaint {
  _id: string;
  user?: { _id: string; name: string; email: string; avatar?: string };
  name?: string;
  email?: string;
  category: ComplaintCategory;
  subject: string;
  message: string;
  status: ComplaintStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface AuthorStats {
  totalPosts: number;
  published: number;
  drafts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  isAuthor: boolean;
  consecutiveApprovals: number;
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

export interface CreateCounselorPayload {
  name: string
  email: string
  password?: string
  departmentId?: string
  bio?: string
  specializations?: string[]
  qualifications?: string[]
  isAvailable?: boolean
}

export interface CreateDeptAdminPayload {
  name: string
  email: string
  password?: string
  departmentId?: string
}

export interface UpdateDepartmentPayload {
  name?: string
  description?: string
  icon?: string
  color?: string
  isActive?: boolean
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  icon?: string
  color?: string
  isActive?: boolean
}

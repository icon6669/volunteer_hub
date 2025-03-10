import { User as SupabaseUser } from './supabase';

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VOLUNTEER = 'VOLUNTEER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  userRole: UserRole;
  emailNotifications: boolean;
  unreadMessages: number;
  providerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  googleAuthEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  facebookAuthEnabled: boolean;
  facebookAppId: string;
  facebookAppSecret: string;
  organizationName: string;
  organizationLogo: string;
  primaryColor: string;
  allowPublicEventViewing: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  landingPageEnabled: boolean;
  landingPageTitle: string;
  landingPageDescription: string;
  landingPageImage?: string;
  landingPageTheme: string;
  customUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  eventId: string;
  name: string;
  description: string;
  capacity: number;
  maxCapacity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Volunteer {
  id: string;
  roleId: string;
  name: string;
  email: string;
  phone: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to convert between Supabase and App types
export const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    name: supabaseUser.name,
    email: supabaseUser.email,
    image: supabaseUser.image || undefined,
    userRole: supabaseUser.userRole,
    emailNotifications: supabaseUser.emailNotifications,
    unreadMessages: supabaseUser.unreadMessages,
    providerId: supabaseUser.providerId || undefined,
    createdAt: supabaseUser.createdAt,
    updatedAt: supabaseUser.updatedAt
  };
};

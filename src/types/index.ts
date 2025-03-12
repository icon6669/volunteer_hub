import { User as SupabaseUser } from './supabase';

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VOLUNTEER = 'VOLUNTEER'
}

export enum LandingPageTheme {
  DEFAULT = 'default',
  DARK = 'dark',
  LIGHT = 'light',
  COLORFUL = 'colorful'
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
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface Role {
  id: string;
  event_id: string;
  name: string;
  description: string;
  capacity: number;
  max_capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  role_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
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
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at
  };
};

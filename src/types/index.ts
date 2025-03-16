import type { Database } from './supabase';

export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  MANAGER = 'manager',
  VOLUNTEER = 'volunteer'
}

export enum LandingPageTheme {
  LIGHT = 'light',
  DARK = 'dark',
  COLORFUL = 'colorful'
}

export enum MessageRecipientType {
  INDIVIDUAL = 'individual',
  EVENT = 'event',
  ROLE = 'role',
  ALL = 'all'
}

export type DatabaseTables = Database['public']['Tables'];

// Base types from database
type DbUser = DatabaseTables['users']['Row'];
type DbEvent = DatabaseTables['events']['Row'];
type DbRole = DatabaseTables['roles']['Row'];
type DbMessage = DatabaseTables['messages']['Row'];
export type DbVolunteer = DatabaseTables['volunteers']['Row'];

// Application types with additional fields
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  userRole: UserRole;
  user_role: DbUser['user_role']; 
  emailNotifications: boolean;
  unreadMessages: number;
  providerId?: string | null;
  created_at: string; 
  updated_at: string; 
}

// Extended user type for UI components that need additional user information
export interface ExtendedUser {
  id: string;
  email: string | null;
  user_role?: UserRole;
  emailNotifications?: boolean;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Event = DbEvent & {
  roles?: Role[];
};

export type Role = DbRole & {
  volunteers?: Volunteer[];
};

// Define Volunteer interface with camelCase properties
export interface Volunteer {
  id: string;
  roleId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to transform database volunteer to application volunteer
export function transformDatabaseVolunteer(dbVolunteer: DbVolunteer): Volunteer {
  return {
    id: dbVolunteer.id,
    roleId: dbVolunteer.role_id,
    userId: dbVolunteer.user_id,
    name: dbVolunteer.name,
    email: dbVolunteer.email,
    phone: dbVolunteer.phone || '',
    description: dbVolunteer.description || '',
    createdAt: dbVolunteer.created_at,
    updatedAt: dbVolunteer.updated_at
  };
}

// Message type with additional read property
export interface Message {
  id: string;
  senderId: string;
  eventId: string;
  recipientId?: string;
  subject?: string;
  content: string;
  timestamp: string;
  read?: boolean;
}

export interface MessageFormData {
  recipientType: MessageRecipientType;
  recipientId?: string;
  eventId?: string;
  roleId?: string;
  content: string;
}

export type SystemSettings = {
  googleAuthEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  facebookAuthEnabled: boolean;
  facebookAppId: string;
  facebookAppSecret: string;
  emailAuthEnabled: boolean;
  landingPageTheme: LandingPageTheme;
  organizationName: string;
  organizationLogo: string;
  primaryColor: string;
  allowPublicEventViewing: boolean;
};

// Helper functions to transform between database and app types
export function transformDatabaseUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image || undefined,
    userRole: dbUser.user_role as UserRole,
    user_role: dbUser.user_role,
    emailNotifications: dbUser.email_notifications,
    unreadMessages: dbUser.unread_messages,
    providerId: dbUser.provider_id || undefined,
    created_at: dbUser.created_at,
    updated_at: dbUser.updated_at
  };
}

export function transformDatabaseEvent(dbEvent: DbEvent): Event {
  return { ...dbEvent, roles: [] };
}

export function transformDatabaseRole(dbRole: DbRole): Role {
  return { ...dbRole, volunteers: [] };
}

export function transformDatabaseMessage(dbMessage: DbMessage): Message {
  return {
    id: dbMessage.id,
    senderId: dbMessage.sender_id,
    eventId: dbMessage.event_id,
    recipientId: '',  // Default empty string for optional properties
    subject: '',      // Default empty string for optional properties
    content: dbMessage.content,
    timestamp: dbMessage.created_at,
    read: false
  };
}

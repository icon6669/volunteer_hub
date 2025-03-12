import { Database } from './supabase';

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VOLUNTEER = 'VOLUNTEER'
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

export type { Database } from './supabase';

export type DatabaseTables = Database['public']['Tables'];

// Base types from database
type DbUser = DatabaseTables['users']['Row'];
type DbEvent = DatabaseTables['events']['Row'];
type DbRole = DatabaseTables['roles']['Row'];
type DbVolunteer = DatabaseTables['volunteers']['Row'];
type DbMessage = DatabaseTables['messages']['Row'];

// Application types with additional fields
export type User = DbUser;

export type Event = DbEvent & {
  roles?: Role[];
};

export type Role = DbRole & {
  volunteers?: Volunteer[];
};

export type Volunteer = DbVolunteer;

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
  return dbUser;
}

export function transformDatabaseEvent(dbEvent: DbEvent): Event {
  return { ...dbEvent, roles: [] };
}

export function transformDatabaseRole(dbRole: DbRole): Role {
  return { ...dbRole, volunteers: [] };
}

export function transformDatabaseVolunteer(dbVolunteer: DbVolunteer): Volunteer {
  return dbVolunteer;
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

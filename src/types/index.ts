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

export type { Database } from './supabase';

export type DatabaseTables = Database['public']['Tables'];

// Base types from database
type DbUser = DatabaseTables['users']['Row'];
type DbEvent = DatabaseTables['events']['Row'];
type DbRole = DatabaseTables['roles']['Row'];
type DbVolunteer = DatabaseTables['volunteers']['Row'];
type DbMessage = DatabaseTables['messages']['Row'];
type DbSystemSettings = DatabaseTables['system_settings']['Row'];

// Application types with additional fields
export type User = DbUser;

export type Event = DbEvent & {
  roles?: Role[];
};

export type Role = DbRole & {
  volunteers?: Volunteer[];
};

export type Volunteer = DbVolunteer;

export type Message = DbMessage;

export type SystemSettings = DbSystemSettings;

// Helper functions to transform between database and app types
export const transformDatabaseUser = (dbUser: DbUser): User => dbUser;

export const transformDatabaseEvent = (dbEvent: DbEvent): Event => dbEvent;

export const transformDatabaseRole = (dbRole: DbRole): Role => dbRole;

export const transformDatabaseVolunteer = (dbVolunteer: DbVolunteer): Volunteer => dbVolunteer;

export const transformDatabaseMessage = (dbMessage: DbMessage): Message => dbMessage;

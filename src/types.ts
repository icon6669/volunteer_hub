export interface Role {
  id: string;
  name: string;
  description: string;
  capacity: number;
  maxCapacity?: number; // Optional maximum capacity
  volunteers: Volunteer[];
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  roles: Role[];
  landingPageEnabled?: boolean;
  landingPageTitle?: string;
  landingPageDescription?: string;
  landingPageImage?: string;
  landingPageTheme?: 'default' | 'dark' | 'light' | 'colorful';
  customUrl?: string; // Added for custom landing page URLs
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  roleId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  userRole: UserRole;
  emailNotifications: boolean;
  unreadMessages: number;
  providerId?: string; // Added for social login
}

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  VOLUNTEER = 'volunteer'
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export enum MessageRecipientType {
  INDIVIDUAL = 'individual',
  EVENT = 'event',
  ROLE = 'role',
  ALL = 'all'
}

export interface MessageFormData {
  recipientType: MessageRecipientType;
  recipientId?: string;
  eventId?: string;
  roleId?: string;
  subject: string;
  content: string;
}

export enum AuthProviderType {
  EMAIL = 'email',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}

export interface SystemSettings {
  googleAuthEnabled: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookAuthEnabled: boolean;
  facebookAppId?: string;
  facebookAppSecret?: string;
  organizationName: string;
  organizationLogo?: string;
  primaryColor?: string;
  allowPublicEventViewing: boolean;
}
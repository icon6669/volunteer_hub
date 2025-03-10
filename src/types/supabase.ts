export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VOLUNTEER = 'VOLUNTEER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  userRole: UserRole; // Maps to 'userrole' in the database
  emailNotifications: boolean; // Maps to 'emailnotifications' in the database
  unreadMessages: number; // Maps to 'unreadmessages' in the database
  providerId: string | null; // Maps to 'providerid' in the database
  createdAt?: string; // Maps to 'created_at' in the database
  updatedAt?: string; // Maps to 'updated_at' in the database
}

export interface Database {
  public: {
    Tables: {
      system_settings: {
        Row: {
          id: string;
          google_auth_enabled: boolean;
          google_client_id: string | null;
          google_client_secret: string | null;
          facebook_auth_enabled: boolean;
          facebook_app_id: string | null;
          facebook_app_secret: string | null;
          organization_name: string;
          organization_logo: string | null;
          primary_color: string;
          allow_public_event_viewing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          google_auth_enabled?: boolean;
          google_client_id?: string | null;
          google_client_secret?: string | null;
          facebook_auth_enabled?: boolean;
          facebook_app_id?: string | null;
          facebook_app_secret?: string | null;
          organization_name?: string;
          organization_logo?: string | null;
          primary_color?: string;
          allow_public_event_viewing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          google_auth_enabled?: boolean;
          google_client_id?: string | null;
          google_client_secret?: string | null;
          facebook_auth_enabled?: boolean;
          facebook_app_id?: string | null;
          facebook_app_secret?: string | null;
          organization_name?: string;
          organization_logo?: string | null;
          primary_color?: string;
          allow_public_event_viewing?: boolean;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          image: string | null;
          userrole: string;
          emailnotifications: boolean;
          unreadmessages: number;
          providerid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          image?: string | null;
          userrole?: string;
          emailnotifications?: boolean;
          unreadmessages?: number;
          providerid?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          image?: string | null;
          userrole?: string;
          emailnotifications?: boolean;
          unreadmessages?: number;
          providerid?: string | null;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          date: string;
          location: string;
          description: string;
          landing_page_enabled: boolean;
          landing_page_title: string;
          landing_page_description: string;
          landing_page_image: string | null;
          landing_page_theme: string;
          custom_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          location: string;
          description: string;
          landing_page_enabled?: boolean;
          landing_page_title?: string;
          landing_page_description?: string;
          landing_page_image?: string | null;
          landing_page_theme?: string;
          custom_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          date?: string;
          location?: string;
          description?: string;
          landing_page_enabled?: boolean;
          landing_page_title?: string;
          landing_page_description?: string;
          landing_page_image?: string | null;
          landing_page_theme?: string;
          custom_url?: string | null;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string;
          capacity: number;
          max_capacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description: string;
          capacity?: number;
          max_capacity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          name?: string;
          description?: string;
          capacity?: number;
          max_capacity?: number;
          updated_at?: string;
        };
      };
      volunteers: {
        Row: {
          id: string;
          role_id: string;
          name: string;
          email: string;
          phone: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          name: string;
          email: string;
          phone: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          subject: string;
          content: string;
          timestamp: string;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          subject: string;
          content: string;
          timestamp: string;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sender_id?: string;
          recipient_id?: string;
          subject?: string;
          content?: string;
          timestamp?: string;
          read?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

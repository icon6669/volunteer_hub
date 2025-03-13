import { UserRole, SystemSettings } from './index';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          image: string | null;
          user_role: UserRole;
          email_notifications: boolean;
          unread_messages: number;
          provider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          image?: string | null;
          user_role?: UserRole;
          email_notifications?: boolean;
          unread_messages?: number;
          provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          image?: string | null;
          user_role?: UserRole;
          email_notifications?: boolean;
          unread_messages?: number;
          provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          location: string | null;
          start_date: string;
          end_date: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          location?: string | null;
          start_date: string;
          end_date: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          start_date?: string;
          end_date?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          capacity: number;
          max_capacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          capacity?: number;
          max_capacity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          capacity?: number;
          max_capacity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      volunteers: {
        Row: {
          id: string;
          role_id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          event_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: string | SystemSettings;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string | SystemSettings;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string | SystemSettings;
          created_at?: string;
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

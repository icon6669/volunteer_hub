import { BaseService } from './BaseService';
import { User, UserRole } from '../types';
import { Database } from '../types/supabase';

export class UserService extends BaseService {
  private readonly TABLE = 'users';
  private readonly CACHE_PREFIX = 'vh_user_';

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*');

      if (error) {
        throw error;
      }

      return data.map(user => this.transformUser(user));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data ? this.transformUser(data) : null;
    } catch (error) {
      console.error(`Error in getUserById for id ${id}:`, error);
      throw error;
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    try {
      const { data, error } = await this.client.from(this.TABLE).insert([{
        name: user.name,
        email: user.email,
        image: user.image,
        user_role: user.userRole,
        email_notifications: user.emailNotifications,
        unread_messages: user.unreadMessages,
        provider_id: user.providerId
      }]).select().single();

      if (error) {
        throw error;
      }

      return this.transformUser(data);
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.userRole !== undefined) updateData.user_role = updates.userRole;
      if (updates.emailNotifications !== undefined) updateData.email_notifications = updates.emailNotifications;
      if (updates.unreadMessages !== undefined) updateData.unread_messages = updates.unreadMessages;
      if (updates.providerId !== undefined) updateData.provider_id = updates.providerId;

      const { data, error } = await this.client
        .from(this.TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.transformUser(data);
    } catch (error) {
      console.error(`Error in updateUser for id ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Error in deleteUser for id ${id}:`, error);
      throw error;
    }
  }

  private transformUser(user: Database['public']['Tables']['users']['Row']): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || undefined,
      userRole: user.user_role as UserRole,
      emailNotifications: user.email_notifications,
      unreadMessages: user.unread_messages,
      providerId: user.provider_id || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

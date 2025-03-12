import { BaseService } from './BaseService';
import { User, UserRole } from '../types';
import { Database } from '../types/supabase';

export class UserService extends BaseService {
  private readonly TABLE = 'users';
  private readonly CACHE_PREFIX = 'vh_user_';

  async getUsers(): Promise<User[]> {
    const cacheKey = `${this.CACHE_PREFIX}list`;
    
    // Try cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }

    const users = await this.handleQuery<Database['public']['Tables']['users']['Row'][]>(
      () => this.client.from(this.TABLE)
        .select('*'),
      'getUsers'
    );

    const transformedUsers = users.map(this.transformUser);
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedUsers,
      timestamp: Date.now()
    }));

    return transformedUsers;
  }

  async getUser(id: string): Promise<User> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    // Try cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache valid for 15 minutes
      if (Date.now() - timestamp < 15 * 60 * 1000) {
        return data;
      }
    }

    const user = await this.handleQuery<Database['public']['Tables']['users']['Row']>(
      () => this.client.from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single(),
      'getUser'
    );

    const transformedUser = this.transformUser(user);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedUser,
      timestamp: Date.now()
    }));

    return transformedUser;
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newUser = await this.handleQuery<Database['public']['Tables']['users']['Row']>(
      () => this.client.from(this.TABLE).insert([{
        name: user.name,
        email: user.email,
        image: user.image,
        userrole: user.userRole,
        emailnotifications: user.emailNotifications,
        unreadmessages: user.unreadMessages,
        providerid: user.providerId
      }]).select().single(),
      'createUser'
    );

    const transformedUser = this.transformUser(newUser);
    
    // Clear users list cache
    localStorage.removeItem(`${this.CACHE_PREFIX}list`);
    
    return transformedUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const updatedUser = await this.handleQuery<Database['public']['Tables']['users']['Row']>(
      () => this.client.from(this.TABLE).update({
        name: updates.name,
        email: updates.email,
        image: updates.image,
        userrole: updates.userRole,
        emailnotifications: updates.emailNotifications,
        unreadmessages: updates.unreadMessages,
        providerid: updates.providerId
      }).eq('id', id).select().single(),
      'updateUser'
    );

    const transformedUser = this.transformUser(updatedUser);
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    localStorage.removeItem(`${this.CACHE_PREFIX}list`);
    
    return transformedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await this.handleQuery<null>(
      () => this.client.from(this.TABLE).delete().eq('id', id),
      'deleteUser'
    );
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    localStorage.removeItem(`${this.CACHE_PREFIX}list`);
  }

  private transformUser(user: Database['public']['Tables']['users']['Row']): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || undefined,
      userRole: user.userrole as UserRole,
      emailNotifications: user.emailnotifications,
      unreadMessages: user.unreadmessages,
      providerId: user.providerid || undefined,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
}

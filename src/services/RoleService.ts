import { BaseService } from './BaseService';
import { Role } from '../types';
import { Database } from '../types/supabase';

export class RoleService extends BaseService {
  private readonly TABLE = 'roles';
  private readonly CACHE_PREFIX = 'vh_role_';
  private readonly EVENT_ROLES_PREFIX = 'vh_event_roles_';

  async getRoles(eventId: string): Promise<Role[]> {
    const cacheKey = `${this.EVENT_ROLES_PREFIX}${eventId}`;
    
    // Try cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }

    const roles = await this.handleQuery<Database['public']['Tables']['roles']['Row'][]>(
      () => this.client.from(this.TABLE)
        .select('*')
        .eq('event_id', eventId),
      'getRoles'
    );

    const transformedRoles = roles.map(this.transformRole);
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedRoles,
      timestamp: Date.now()
    }));

    return transformedRoles;
  }

  async getRole(id: string): Promise<Role> {
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

    const role = await this.handleQuery<Database['public']['Tables']['roles']['Row']>(
      () => this.client.from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single(),
      'getRole'
    );

    const transformedRole = this.transformRole(role);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedRole,
      timestamp: Date.now()
    }));

    return transformedRole;
  }

  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const newRole = await this.handleQuery<Database['public']['Tables']['roles']['Row']>(
      () => this.client.from(this.TABLE).insert([{
        event_id: role.event_id,
        name: role.name,
        description: role.description,
        capacity: role.capacity,
        max_capacity: role.max_capacity
      }]).select().single(),
      'createRole'
    );

    const transformedRole = this.transformRole(newRole);
    
    // Clear event roles cache
    localStorage.removeItem(`${this.EVENT_ROLES_PREFIX}${role.event_id}`);
    
    return transformedRole;
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const updatedRole = await this.handleQuery<Database['public']['Tables']['roles']['Row']>(
      () => this.client.from(this.TABLE).update({
        event_id: updates.event_id,
        name: updates.name,
        description: updates.description,
        capacity: updates.capacity,
        max_capacity: updates.max_capacity
      }).eq('id', id).select().single(),
      'updateRole'
    );

    const transformedRole = this.transformRole(updatedRole);
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    if (updates.event_id) {
      localStorage.removeItem(`${this.EVENT_ROLES_PREFIX}${updates.event_id}`);
    }
    
    return transformedRole;
  }

  async deleteRole(id: string, eventId: string): Promise<void> {
    await this.handleQuery<null>(
      () => this.client.from(this.TABLE).delete().eq('id', id),
      'deleteRole'
    );
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    localStorage.removeItem(`${this.EVENT_ROLES_PREFIX}${eventId}`);
  }

  private transformRole(role: Database['public']['Tables']['roles']['Row']): Role {
    return {
      id: role.id,
      event_id: role.event_id,
      name: role.name,
      description: role.description,
      capacity: role.capacity,
      max_capacity: role.max_capacity,
      created_at: role.created_at,
      updated_at: role.updated_at
    };
  }
}

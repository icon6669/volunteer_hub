import { BaseService } from './BaseService';
import { Volunteer } from '../types';
import { Database } from '../types/supabase';

export class VolunteerService extends BaseService {
  private readonly TABLE = 'volunteers';
  private readonly CACHE_PREFIX = 'vh_volunteer_';
  private readonly ROLE_VOLUNTEERS_PREFIX = 'vh_role_volunteers_';

  async getVolunteers(roleId: string): Promise<Volunteer[]> {
    const cacheKey = `${this.ROLE_VOLUNTEERS_PREFIX}${roleId}`;
    
    // Try cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }

    const volunteers = await this.handleQuery<Database['public']['Tables']['volunteers']['Row'][]>(
      () => this.client.from(this.TABLE)
        .select('*')
        .eq('role_id', roleId),
      'getVolunteers'
    );

    const transformedVolunteers = volunteers.map(this.transformVolunteer);
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedVolunteers,
      timestamp: Date.now()
    }));

    return transformedVolunteers;
  }

  async getVolunteer(id: string): Promise<Volunteer> {
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

    const volunteer = await this.handleQuery<Database['public']['Tables']['volunteers']['Row']>(
      () => this.client.from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single(),
      'getVolunteer'
    );

    const transformedVolunteer = this.transformVolunteer(volunteer);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedVolunteer,
      timestamp: Date.now()
    }));

    return transformedVolunteer;
  }

  async createVolunteer(volunteer: Omit<Volunteer, 'id' | 'created_at' | 'updated_at'>): Promise<Volunteer> {
    const newVolunteer = await this.handleQuery<Database['public']['Tables']['volunteers']['Row']>(
      () => this.client.from(this.TABLE).insert([{
        role_id: volunteer.role_id,
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        description: volunteer.description
      }]).select().single(),
      'createVolunteer'
    );

    const transformedVolunteer = this.transformVolunteer(newVolunteer);
    
    // Clear role volunteers cache
    localStorage.removeItem(`${this.ROLE_VOLUNTEERS_PREFIX}${volunteer.role_id}`);
    
    return transformedVolunteer;
  }

  async updateVolunteer(id: string, updates: Partial<Volunteer>): Promise<Volunteer> {
    const updatedVolunteer = await this.handleQuery<Database['public']['Tables']['volunteers']['Row']>(
      () => this.client.from(this.TABLE).update({
        role_id: updates.role_id,
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        description: updates.description
      }).eq('id', id).select().single(),
      'updateVolunteer'
    );

    const transformedVolunteer = this.transformVolunteer(updatedVolunteer);
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    if (updates.role_id) {
      localStorage.removeItem(`${this.ROLE_VOLUNTEERS_PREFIX}${updates.role_id}`);
    }
    
    return transformedVolunteer;
  }

  async deleteVolunteer(id: string, roleId: string): Promise<void> {
    await this.handleQuery<null>(
      () => this.client.from(this.TABLE).delete().eq('id', id),
      'deleteVolunteer'
    );
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    localStorage.removeItem(`${this.ROLE_VOLUNTEERS_PREFIX}${roleId}`);
  }

  private transformVolunteer(volunteer: Database['public']['Tables']['volunteers']['Row']): Volunteer {
    return {
      id: volunteer.id,
      role_id: volunteer.role_id,
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      description: volunteer.description,
      created_at: volunteer.created_at,
      updated_at: volunteer.updated_at
    };
  }
}

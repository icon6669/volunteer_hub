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

    const { data: volunteers } = await this.client.from(this.TABLE)
      .select('*')
      .eq('role_id', roleId);

    if (!volunteers) {
      return [];
    }

    const transformedVolunteers = volunteers.map(volunteer => this.transformVolunteer(volunteer));
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedVolunteers,
      timestamp: Date.now()
    }));

    return transformedVolunteers;
  }

  async getVolunteer(id: string): Promise<Volunteer | null> {
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

    const { data: volunteer } = await this.client.from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (!volunteer) {
      return null;
    }

    const transformedVolunteer = this.transformVolunteer(volunteer);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformedVolunteer,
      timestamp: Date.now()
    }));
    
    return transformedVolunteer;
  }

  async createVolunteer(data: {
    roleId: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    description: string;
  }): Promise<Volunteer> {
    // Map from application type (camelCase) to database type (snake_case)
    const dbVolunteer = {
      role_id: data.roleId,
      user_id: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      description: data.description
    };

    const { data: newVolunteer, error } = await this.client.from(this.TABLE)
      .insert([dbVolunteer])
      .select()
      .single();

    if (error || !newVolunteer) {
      throw new Error(`Failed to create volunteer: ${error?.message || 'Unknown error'}`);
    }

    const transformedVolunteer = this.transformVolunteer(newVolunteer);
    
    // Clear role volunteers cache
    localStorage.removeItem(`${this.ROLE_VOLUNTEERS_PREFIX}${data.roleId}`);
    
    return transformedVolunteer;
  }

  async updateVolunteer(id: string, data: {
    roleId?: string;
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    description?: string;
  }): Promise<Volunteer> {
    // Map from application type (camelCase) to database type (snake_case)
    const updateData: Partial<Database['public']['Tables']['volunteers']['Update']> = {};
    
    // Only include fields that are provided
    if (data.roleId !== undefined) updateData.role_id = data.roleId;
    if (data.userId !== undefined) updateData.user_id = data.userId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.description !== undefined) updateData.description = data.description;
    
    const { data: updatedVolunteer, error } = await this.client.from(this.TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedVolunteer) {
      throw new Error(`Failed to update volunteer: ${error?.message || 'Volunteer not found'}`);
    }

    const transformedVolunteer = this.transformVolunteer(updatedVolunteer);
    
    // Clear caches
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
    if (data.roleId) {
      localStorage.removeItem(`${this.ROLE_VOLUNTEERS_PREFIX}${data.roleId}`);
    }
    
    return transformedVolunteer;
  }

  async deleteVolunteer(id: string): Promise<void> {
    const { error } = await this.client.from(this.TABLE)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete volunteer: ${error.message}`);
    }
    
    // Clear cache
    localStorage.removeItem(`${this.CACHE_PREFIX}${id}`);
  }

  // Transform from database type (snake_case) to application type (camelCase)
  private transformVolunteer = (volunteer: Database['public']['Tables']['volunteers']['Row']): Volunteer => {
    return {
      id: volunteer.id,
      roleId: volunteer.role_id,
      userId: volunteer.user_id,
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone || '',
      description: volunteer.description || '',
      createdAt: volunteer.created_at,
      updatedAt: volunteer.updated_at
    };
  };
}

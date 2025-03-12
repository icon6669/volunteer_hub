import { User, Event, Role, Volunteer, Message } from './types';
import type { Database } from './types/supabase';
import { supabase } from './lib/supabase';

type Tables = Database['public']['Tables'];

export class UserService {
  async getUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(id: string, updates: Partial<Tables['users']['Update']>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export class EventService {
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        roles (
          *,
          volunteers (*)
        )
      `);

    if (error) throw error;
    return data;
  }

  async getEvent(id: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        roles (
          *,
          volunteers (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createEvent(event: Tables['events']['Insert']): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEvent(id: string, updates: Tables['events']['Update']): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export class RoleService {
  async getRoles(eventId: string): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        volunteers (*)
      `)
      .eq('event_id', eventId);

    if (error) throw error;
    return data;
  }

  async getRole(id: string): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        volunteers (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createRole(role: Tables['roles']['Insert']): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRole(id: string, updates: Tables['roles']['Update']): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export class VolunteerService {
  async getVolunteers(roleId: string): Promise<Volunteer[]> {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('role_id', roleId);

    if (error) throw error;
    return data;
  }

  async getVolunteer(id: string): Promise<Volunteer> {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createVolunteer(volunteer: Tables['volunteers']['Insert']): Promise<Volunteer> {
    const { data, error } = await supabase
      .from('volunteers')
      .insert(volunteer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVolunteer(id: string, updates: Tables['volunteers']['Update']): Promise<Volunteer> {
    const { data, error } = await supabase
      .from('volunteers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVolunteer(id: string): Promise<void> {
    const { error } = await supabase
      .from('volunteers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export class MessageService {
  async getMessages(eventId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return data;
  }

  async createMessage(message: Tables['messages']['Insert']): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
import { Event, Message, SystemSettings, User, UserRole } from './types';
import { supabase } from './supabase';

// Settings API
export const fetchSettings = async (): Promise<SystemSettings> => {
  try {
    if (supabase) {
      // Try to fetch from Supabase if connected
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching settings from Supabase:', error);
        throw error;
      }
      
      return data;
    } else {
      throw new Error('Supabase not connected');
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    // Return default settings if Supabase fetch fails
    return {
      googleAuthEnabled: false,
      googleClientId: '',
      googleClientSecret: '',
      facebookAuthEnabled: false,
      facebookAppId: '',
      facebookAppSecret: '',
      organizationName: 'Volunteer Hub',
      organizationLogo: '',
      primaryColor: '#0ea5e9',
      allowPublicEventViewing: false,
    };
  }
};

export const saveSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    // Check if settings record exists
    const { data: existingSettings } = await supabase
      .from('system_settings')
      .select('id')
      .single();
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('system_settings')
        .update(settings)
        .eq('id', existingSettings.id);
      
      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('system_settings')
        .insert([settings]);
      
      if (error) {
        console.error('Error inserting settings:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Users API
export const fetchUsers = async (): Promise<User[]> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      userRole: user.user_role as UserRole,
      emailNotifications: user.email_notifications,
      unreadMessages: user.unread_messages,
      providerId: user.provider_id
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const saveUser = async (user: User): Promise<User | null> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('users')
      .upsert([{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        user_role: user.userRole,
        email_notifications: user.emailNotifications,
        unread_messages: user.unreadMessages,
        provider_id: user.providerId
      }]);
    
    if (error) {
      console.error('Error saving user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error saving user:', error);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('users')
      .update({ user_role: role })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

export const updateEmailNotifications = async (userId: string, enabled: boolean): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('users')
      .update({ email_notifications: enabled })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating email notifications:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating email notifications:', error);
    return false;
  }
};

export const incrementUnreadMessages = async (userId: string): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    // Get current unread count
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('unread_messages')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching unread messages count:', fetchError);
      return false;
    }
    
    const currentCount = data?.unread_messages || 0;
    
    // Update unread messages count
    const { error } = await supabase
      .from('users')
      .update({ unread_messages: currentCount + 1 })
      .eq('id', userId);
    
    if (error) {
      console.error('Error incrementing unread messages:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error incrementing unread messages:', error);
    return false;
  }
};

export const resetUnreadMessages = async (userId: string): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('users')
      .update({ unread_messages: 0 })
      .eq('id', userId);
    
    if (error) {
      console.error('Error resetting unread messages:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting unread messages:', error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Events API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*');
    
    if (eventsError) {
      console.error('Error loading events:', eventsError);
      throw eventsError;
    }
    
    // Fetch roles for each event
    const eventsWithRoles = await Promise.all(eventsData.map(async (event) => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('event_id', event.id);
      
      if (rolesError) {
        console.error(`Error loading roles for event ${event.id}:`, rolesError);
        return { ...event, roles: [] };
      }
      
      // Fetch volunteers for each role
      const rolesWithVolunteers = await Promise.all(rolesData.map(async (role) => {
        const { data: volunteersData, error: volunteersError } = await supabase
          .from('volunteers')
          .select('*')
          .eq('role_id', role.id);
        
        if (volunteersError) {
          console.error(`Error loading volunteers for role ${role.id}:`, volunteersError);
          return { ...role, volunteers: [] };
        }
        
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          capacity: role.capacity,
          maxCapacity: role.max_capacity,
          volunteers: volunteersData.map(v => ({
            id: v.id,
            name: v.name,
            email: v.email,
            phone: v.phone,
            description: v.description || '',
            roleId: v.role_id
          }))
        };
      }));
      
      return {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
        landingPageEnabled: event.landing_page_enabled,
        landingPageTitle: event.landing_page_title,
        landingPageDescription: event.landing_page_description,
        landingPageImage: event.landing_page_image,
        landingPageTheme: event.landing_page_theme,
        customUrl: event.custom_url,
        roles: rolesWithVolunteers
      };
    }));
    
    return eventsWithRoles;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const saveEvent = async (event: Event): Promise<Event | null> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    // Insert or update event
    const { error } = await supabase
      .from('events')
      .upsert([{
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
        landing_page_enabled: event.landingPageEnabled,
        landing_page_title: event.landingPageTitle,
        landing_page_description: event.landingPageDescription,
        landing_page_image: event.landingPageImage,
        landing_page_theme: event.landingPageTheme,
        custom_url: event.customUrl
      }]);
    
    if (error) {
      console.error('Error saving event:', error);
      return null;
    }
    
    return event;
  } catch (error) {
    console.error('Error saving event:', error);
    return null;
  }
};

export const updateEvent = async (event: Event): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    // Update event
    const { error: eventError } = await supabase
      .from('events')
      .update({
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
        landing_page_enabled: event.landingPageEnabled,
        landing_page_title: event.landingPageTitle,
        landing_page_description: event.landingPageDescription,
        landing_page_image: event.landingPageImage,
        landing_page_theme: event.landingPageTheme,
        custom_url: event.customUrl
      })
      .eq('id', event.id);
    
    if (eventError) {
      console.error('Error updating event:', eventError);
      return false;
    }
    
    // Handle roles and volunteers
    for (const role of event.roles) {
      // Update or insert role
      const { error: roleError } = await supabase
        .from('roles')
        .upsert([{
          id: role.id,
          event_id: event.id,
          name: role.name,
          description: role.description,
          capacity: role.capacity,
          max_capacity: role.maxCapacity
        }]);
      
      if (roleError) {
        console.error('Error updating role:', roleError);
        continue;
      }
      
      // Handle volunteers for this role
      for (const volunteer of role.volunteers) {
        const { error: volunteerError } = await supabase
          .from('volunteers')
          .upsert([{
            id: volunteer.id,
            role_id: role.id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            description: volunteer.description
          }]);
        
        if (volunteerError) {
          console.error('Error updating volunteer:', volunteerError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating event:', error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    // Delete event (cascade will delete roles and volunteers)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

// Messages API
export const fetchMessages = async (userId?: string): Promise<Message[]> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    let query = supabase.from('messages').select('*');
    
    if (userId) {
      query = query.or(`recipient_id.eq.${userId},sender_id.eq.${userId}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
    
    return data.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      subject: msg.subject,
      content: msg.content,
      timestamp: msg.timestamp,
      read: msg.read
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const saveMessage = async (message: Message): Promise<Message | null> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('messages')
      .upsert([{
        id: message.id,
        sender_id: message.senderId,
        recipient_id: message.recipientId,
        subject: message.subject,
        content: message.content,
        timestamp: message.timestamp,
        read: message.read
      }]);
    
    if (error) {
      console.error('Error saving message:', error);
      return null;
    }
    
    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};

export const saveMessages = async (messages: Message[]): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const messagesToInsert = messages.map(msg => ({
      id: msg.id,
      sender_id: msg.senderId,
      recipient_id: msg.recipientId,
      subject: msg.subject,
      content: msg.content,
      timestamp: msg.timestamp,
      read: msg.read
    }));
    
    const { error } = await supabase
      .from('messages')
      .upsert(messagesToInsert);
    
    if (error) {
      console.error('Error saving messages:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    if (!supabase) {
      throw new Error('Supabase not connected');
    }
    
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};
import { Event, Message, SystemSettings, User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

// Helper function to handle database errors
const handleDbError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

// Settings API
export const fetchSettings = async (): Promise<SystemSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      googleAuthEnabled: data.google_auth_enabled,
      googleClientId: data.google_client_id || '',
      googleClientSecret: data.google_client_secret || '',
      facebookAuthEnabled: data.facebook_auth_enabled,
      facebookAppId: data.facebook_app_id || '',
      facebookAppSecret: data.facebook_app_secret || '',
      organizationName: data.organization_name,
      organizationLogo: data.organization_logo || '',
      primaryColor: data.primary_color,
      allowPublicEventViewing: data.allow_public_event_viewing,
    };
  } catch (error) {
    handleDbError(error, 'fetch settings');
    // This line won't be reached due to handleDbError throwing
    return {} as SystemSettings;
  }
};

export const saveSettings = async (settings: SystemSettings): Promise<void> => {
  try {
    const { data: existingSettings } = await supabase
      .from('system_settings')
      .select('id')
      .single();
    
    const dbSettings = {
      google_auth_enabled: settings.googleAuthEnabled,
      google_client_id: settings.googleClientId,
      google_client_secret: settings.googleClientSecret,
      facebook_auth_enabled: settings.facebookAuthEnabled,
      facebook_app_id: settings.facebookAppId,
      facebook_app_secret: settings.facebookAppSecret,
      organization_name: settings.organizationName,
      organization_logo: settings.organizationLogo,
      primary_color: settings.primaryColor,
      allow_public_event_viewing: settings.allowPublicEventViewing,
    };

    const { error } = existingSettings
      ? await supabase
          .from('system_settings')
          .update(dbSettings)
          .eq('id', existingSettings.id)
      : await supabase
          .from('system_settings')
          .insert([dbSettings]);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'save settings');
  }
};

// Users API
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || null,
      userRole: user.user_role as UserRole,
      emailNotifications: user.email_notifications,
      unreadMessages: user.unread_messages,
      providerId: user.provider_id
    }));
  } catch (error) {
    handleDbError(error, 'fetch users');
    return [];
  }
};

export const saveUser = async (user: User): Promise<User> => {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        user_role: user.userRole,
        email_notifications: user.emailNotifications,
        unread_messages: user.unreadMessages,
        provider_id: user.providerId
      });
    
    if (error) throw error;
    return user;
  } catch (error) {
    handleDbError(error, 'save user');
    throw error; // This line won't be reached due to handleDbError throwing
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ user_role: role })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'update user role');
  }
};

export const updateEmailNotifications = async (userId: string, enabled: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ email_notifications: enabled })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'update email notifications');
  }
};

export const incrementUnreadMessages = async (userId: string): Promise<void> => {
  try {
    // First get the current count
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('unread_messages')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentCount = data?.unread_messages || 0;
    
    // Then increment it
    const { error } = await supabase
      .from('users')
      .update({ unread_messages: currentCount + 1 })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'increment unread messages');
  }
};

export const resetUnreadMessages = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ unread_messages: 0 })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'reset unread messages');
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'delete user');
  }
};

export const transferOwnership = async (userId: string, newOwnerId: string): Promise<void> => {
  try {
    // Start a transaction to update both users
    const { error: error1 } = await supabase
      .from('users')
      .update({ user_role: UserRole.VOLUNTEER })
      .eq('id', userId);
    
    if (error1) throw error1;
    
    const { error: error2 } = await supabase
      .from('users')
      .update({ user_role: UserRole.OWNER })
      .eq('id', newOwnerId);
    
    if (error2) {
      // Rollback by restoring original owner
      await supabase
        .from('users')
        .update({ user_role: UserRole.OWNER })
        .eq('id', userId);
      
      throw error2;
    }
  } catch (error) {
    handleDbError(error, 'transfer ownership');
  }
};

// Events API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    // Fetch events with roles and volunteers in a single query
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        roles (*, volunteers (*))
      `);
    
    if (eventsError) throw eventsError;
    
    return eventsData.map(event => ({
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
      roles: event.roles?.map((role: { id: string; name: string; description: string; capacity: number; max_capacity: number; volunteers: any[] }) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        capacity: role.capacity,
        maxCapacity: role.max_capacity,
        volunteers: role.volunteers?.map((v: { id: string; name: string; email: string; phone: string; description: string; role_id: string }) => ({
          id: v.id,
          name: v.name,
          email: v.email,
          phone: v.phone,
          description: v.description || '',
          roleId: v.role_id
        })) || []
      })) || []
    }));
  } catch (error) {
    handleDbError(error, 'fetch events');
    return [];
  }
};

export const saveEvent = async (event: Event): Promise<Event> => {
  try {
    const { error } = await supabase
      .from('events')
      .upsert({
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
      });
    
    if (error) throw error;
    return event;
  } catch (error) {
    handleDbError(error, 'save event');
    throw error; // This line won't be reached due to handleDbError throwing
  }
};

export const updateEvent = async (event: Event): Promise<void> => {
  try {
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
    
    if (eventError) throw eventError;
    
    // Handle roles and volunteers
    for (const role of event.roles) {
      // Update or insert role
      const { error: roleError } = await supabase
        .from('roles')
        .upsert({
          id: role.id,
          event_id: event.id,
          name: role.name,
          description: role.description,
          capacity: role.capacity,
          max_capacity: role.maxCapacity
        });
      
      if (roleError) throw roleError;
      
      // Handle volunteers for this role
      for (const volunteer of role.volunteers) {
        const { error: volunteerError } = await supabase
          .from('volunteers')
          .upsert({
            id: volunteer.id,
            role_id: role.id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            description: volunteer.description
          });
        
        if (volunteerError) throw volunteerError;
      }
    }
  } catch (error) {
    handleDbError(error, 'update event');
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    // Delete event (cascade will delete roles and volunteers)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'delete event');
  }
};

// Messages API
export const fetchMessages = async (userId?: string): Promise<Message[]> => {
  try {
    let query = supabase
      .from('messages')
      .select('*');
    
    if (userId) {
      query = query.or(`recipient_id.eq.${userId},sender_id.eq.${userId}`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
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
    handleDbError(error, 'fetch messages');
    return [];
  }
};

export const saveMessage = async (message: Message): Promise<Message> => {
  try {
    const { error } = await supabase
      .from('messages')
      .upsert({
        id: message.id,
        sender_id: message.senderId,
        recipient_id: message.recipientId,
        subject: message.subject,
        content: message.content,
        timestamp: message.timestamp,
        read: message.read
      });
    
    if (error) throw error;
    return message;
  } catch (error) {
    handleDbError(error, 'save message');
    throw error; // This line won't be reached due to handleDbError throwing
  }
};

export const saveMessages = async (messages: Message[]): Promise<void> => {
  try {
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
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'save messages');
  }
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'mark message as read');
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'delete message');
  }
};
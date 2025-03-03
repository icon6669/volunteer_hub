import { Event, Message, SystemSettings, User, UserRole } from '../types';
import { supabase } from '../supabase';
import * as fileStorage from './fileStorage';

// Determine which storage to use
const useSupabase = () => {
  return !!supabase;
};

// Settings API
export const fetchSettings = async (): Promise<SystemSettings> => {
  try {
    if (useSupabase()) {
      // Try to fetch from Supabase if connected
      const { data, error } = await supabase!
        .from('system_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching settings from Supabase:', error);
        throw error;
      }
      
      return data;
    } else {
      // Fall back to file-based storage
      return await fileStorage.getSettings();
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    // Return default settings if fetch fails
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
    if (useSupabase()) {
      // Check if settings record exists
      const { data: existingSettings } = await supabase!
        .from('system_settings')
        .select('id')
        .single();
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase!
          .from('system_settings')
          .update(settings)
          .eq('id', existingSettings.id);
        
        if (error) {
          console.error('Error updating settings:', error);
          return false;
        }
      } else {
        // Insert new settings
        const { error } = await supabase!
          .from('system_settings')
          .insert([settings]);
        
        if (error) {
          console.error('Error inserting settings:', error);
          return false;
        }
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.saveSettings(settings);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Users API
export const fetchUsers = async (): Promise<User[]> => {
  try {
    if (useSupabase()) {
      const { data, error } = await supabase!
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
    } else {
      // Fall back to file-based storage
      return await fileStorage.getUsers();
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const saveUser = async (user: User): Promise<User | null> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
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
    } else {
      // Fall back to file-based storage
      const success = await fileStorage.saveUser(user);
      return success ? user : null;
    }
  } catch (error) {
    console.error('Error saving user:', error);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
        .from('users')
        .update({ user_role: role })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.updateUserRole(userId, role);
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

export const updateEmailNotifications = async (userId: string, enabled: boolean): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
        .from('users')
        .update({ email_notifications: enabled })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating email notifications:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.updateEmailNotifications(userId, enabled);
    }
  } catch (error) {
    console.error('Error updating email notifications:', error);
    return false;
  }
};

export const incrementUnreadMessages = async (userId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      // Get current unread count
      const { data, error: fetchError } = await supabase!
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
      const { error } = await supabase!
        .from('users')
        .update({ unread_messages: currentCount + 1 })
        .eq('id', userId);
      
      if (error) {
        console.error('Error incrementing unread messages:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.incrementUnreadMessages(userId);
    }
  } catch (error) {
    console.error('Error incrementing unread messages:', error);
    return false;
  }
};

export const resetUnreadMessages = async (userId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
        .from('users')
        .update({ unread_messages: 0 })
        .eq('id', userId);
      
      if (error) {
        console.error('Error resetting unread messages:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.resetUnreadMessages(userId);
    }
  } catch (error) {
    console.error('Error resetting unread messages:', error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.deleteUser(userId);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

export const transferOwnership = async (userId: string, newOwnerId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      // Start a transaction to update both users
      const { error: error1 } = await supabase!
        .from('users')
        .update({ user_role: UserRole.MANAGER })
        .eq('id', userId);
      
      if (error1) {
        console.error('Error demoting current owner:', error1);
        return false;
      }
      
      const { error: error2 } = await supabase!
        .from('users')
        .update({ user_role: UserRole.OWNER })
        .eq('id', newOwnerId);
      
      if (error2) {
        console.error('Error promoting new owner:', error2);
        // Try to revert the first change
        await supabase!
          .from('users')
          .update({ user_role: UserRole.OWNER })
          .eq('id', userId);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.transferOwnership(userId, newOwnerId);
    }
  } catch (error) {
    console.error('Error transferring ownership:', error);
    return false;
  }
};

// Events API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    if (useSupabase()) {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase!
        .from('events')
        .select('*');
      
      if (eventsError) {
        console.error('Error loading events:', eventsError);
        throw eventsError;
      }
      
      // Fetch roles for each event
      const eventsWithRoles = await Promise.all(eventsData.map(async (event) => {
        const { data: rolesData, error: rolesError } = await supabase!
          .from('roles')
          .select('*')
          .eq('event_id', event.id);
        
        if (rolesError) {
          console.error(`Error loading roles for event ${event.id}:`, rolesError);
          return { ...event, roles: [] };
        }
        
        // Fetch volunteers for each role
        const rolesWithVolunteers = await Promise.all(rolesData.map(async (role) => {
          const { data: volunteersData, error: volunteersError } = await supabase!
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
    } else {
      // Fall back to file-based storage
      return await fileStorage.getEvents();
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const saveEvent = async (event: Event): Promise<Event | null> => {
  try {
    if (useSupabase()) {
      // Insert or update event
      const { error } = await supabase!
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
    } else {
      // Fall back to file-based storage
      const success = await fileStorage.saveEvent(event);
      return success ? event : null;
    }
  } catch (error) {
    console.error('Error saving event:', error);
    return null;
  }
};

export const updateEvent = async (event: Event): Promise<boolean> => {
  try {
    if (useSupabase()) {
      // Update event
      const { error: eventError } = await supabase!
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
        const { error: roleError } = await supabase!
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
          const { error: volunteerError } = await supabase!
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
    } else {
      // Fall back to file-based storage
      return await fileStorage.updateEvent(event);
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      // Delete event (cascade will delete roles and volunteers)
      const { error } = await supabase!
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) {
        console.error('Error deleting event:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.deleteEvent(eventId);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

// Messages API
export const fetchMessages = async (userId?: string): Promise<Message[]> => {
  try {
    if (useSupabase()) {
      let query = supabase!.from('messages').select('*');
      
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
    } else {
      // Fall back to file-based storage
      return await fileStorage.getMessages(userId);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const saveMessage = async (message: Message): Promise<Message | null> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
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
    } else {
      // Fall back to file-based storage
      const success = await fileStorage.saveMessage(message);
      return success ? message : null;
    }
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};

export const saveMessages = async (messages: Message[]): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const messagesToInsert = messages.map(msg => ({
        id: msg.id,
        sender_id: msg.senderId,
        recipient_id: msg.recipientId,
        subject: msg.subject,
        content: msg.content,
        timestamp: msg.timestamp,
        read: msg.read
      }));
      
      const { error } = await supabase!
        .from('messages')
        .upsert(messagesToInsert);
      
      if (error) {
        console.error('Error saving messages:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.saveMessages(messages);
    }
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      
      if (error) {
        console.error('Error marking message as read:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.markMessageAsRead(messageId);
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    if (useSupabase()) {
      const { error } = await supabase!
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.error('Error deleting message:', error);
        return false;
      }
      
      return true;
    } else {
      // Fall back to file-based storage
      return await fileStorage.deleteMessage(messageId);
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};
import { Event, Message, SystemSettings, User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

// Temporary function to check database policies - remove after debugging
export const checkDatabasePolicies = async () => {
  try {
    // First, test if we can fetch users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, userrole')
      .limit(5);
      
    // Try to call the get_auth_user_role function if it exists
    let roleResult = {};
    try {
      const { data: userRole, error: roleError } = await supabase.rpc('get_auth_user_role');
      roleResult = { functionExists: !roleError, userRole, functionError: roleError };
    } catch (e) {
      roleResult = { functionExists: false, functionError: e };
    }
    
    return {
      usersSuccess: !usersError,
      usersList: users,
      usersError: usersError,
      ...roleResult
    };
  } catch (error) {
    console.error('Policy check error:', error);
    return { error };
  }
};

// Define the response type for fetchUsers
export interface UsersResponse {
  users: User[];
  needsOwner: boolean;
}

// Type for the raw user data from Supabase
interface RawUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  userrole: string;
  emailnotifications: boolean;
  unreadmessages: number;
  providerid?: string;
}

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

// Helper function to check if an owner exists
export const checkOwnerExists = async (): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('userrole', UserRole.OWNER);
    
    if (error) throw error;
    return count ? count > 0 : false;
  } catch (error) {
    handleDbError(error, 'check owner exists');
    return false;
  }
};

// Users API
/**
 * Fetches all users and checks if an owner exists
 * @returns A UsersResponse object containing users and needsOwner flag
 */
export const fetchUsers = async (): Promise<UsersResponse> => {
  try {
    // Get the current authenticated user first
    const { data: authData } = await supabase.auth.getSession();
    const currentUserId = authData?.session?.user?.id;
    
    if (!currentUserId) {
      console.warn('No authenticated user found');
      return { users: [], needsOwner: false };
    }
    
    // In case of RLS recursion issues, use this SQL query approach
    // This uses PostgreSQL's security barrier views to avoid recursion
    const { data: users, error } = await supabase.rpc('get_users_safely');
    
    if (error) {
      console.warn('RPC method failed, trying direct query for current user', error);
      
      // Fall back to just getting the current user if the RPC fails
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();
      
      if (currentUserError) {
        console.error('Failed to fetch current user:', currentUserError);
        throw currentUserError;
      }
      
      // Convert to our application User type
      const appUser: User = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image || undefined,
        userRole: currentUser.userrole === UserRole.OWNER 
          ? UserRole.OWNER 
          : currentUser.userrole === UserRole.MANAGER 
            ? UserRole.MANAGER 
            : UserRole.VOLUNTEER,
        emailNotifications: currentUser.emailnotifications,
        unreadMessages: currentUser.unreadmessages,
        providerId: currentUser.providerid
      };
      
      // Return just the current user
      return {
        users: [appUser],
        needsOwner: currentUser.userrole !== UserRole.OWNER
      };
    }
    
    // If we get here, the RPC call succeeded
    // Convert all users to our application User type
    const appUsers: User[] = (users || []).map((user: RawUser) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || undefined,
      userRole: user.userrole === UserRole.OWNER 
        ? UserRole.OWNER 
        : user.userrole === UserRole.MANAGER 
          ? UserRole.MANAGER 
          : UserRole.VOLUNTEER,
      emailNotifications: user.emailnotifications,
      unreadMessages: user.unreadmessages,
      providerId: user.providerid
    }));
    
    // Check if an owner exists
    const hasOwner = appUsers.some(user => user.userRole === UserRole.OWNER);
    
    return {
      users: appUsers,
      needsOwner: !hasOwner
    };
  } catch (error) {
    console.error(`Error fetching users:`, error);
    // Default to a safe response with just the current user
    return { users: [], needsOwner: false };
  }
};

export const saveUser = async (user: User): Promise<User> => {
  try {
    // Convert user data to database format
    const dbUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      userrole: user.userRole,
      emailnotifications: user.emailNotifications,
      unreadmessages: user.unreadMessages,
      providerid: user.providerId
    };

    // Let policies handle access control
    const { error } = await supabase
      .from('users')
      .upsert(dbUser);
    
    if (error) throw error;
    return user;
  } catch (error) {
    handleDbError(error, 'save user');
    throw error; // This line won't be reached due to handleDbError throwing
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    // Let policies handle access control and validation
    const { error } = await supabase
      .from('users')
      .update({ userrole: role })
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
      .update({ emailnotifications: enabled })
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
      .select('unreadmessages')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentCount = data?.unreadmessages || 0;
    
    // Then increment it
    const { error } = await supabase
      .from('users')
      .update({ unreadmessages: currentCount + 1 })
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
      .update({ unreadmessages: 0 })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    handleDbError(error, 'reset unread messages');
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Let policies handle access control and validation
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
    // Start a transaction to update both users - policies will handle access control
    const { error: error1 } = await supabase
      .from('users')
      .update({ userrole: UserRole.VOLUNTEER })
      .eq('id', userId)
      .eq('userrole', UserRole.OWNER); // Ensure we're updating an owner
    
    if (error1) throw error1;
    
    const { error: error2 } = await supabase
      .from('users')
      .update({ userrole: UserRole.OWNER })
      .eq('id', newOwnerId);
    
    if (error2) {
      // Rollback by restoring original owner
      await supabase
        .from('users')
        .update({ userrole: UserRole.OWNER })
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
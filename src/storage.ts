import { Event, Message, SystemSettings, User, UserRole } from './types';
import { defaultSettings } from './supabase';

// Storage API endpoints
const API_BASE_URL = '/api';
const API_ENDPOINTS = {
  SETTINGS: `${API_BASE_URL}/settings`,
  USERS: `${API_BASE_URL}/users`,
  EVENTS: `${API_BASE_URL}/events`,
  MESSAGES: `${API_BASE_URL}/messages`,
};

// Generic function to fetch data from the server
const fetchData = async <T>(url: string): Promise<T> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

// Generic function to post data to the server
const postData = async <T, R>(url: string, data: T): Promise<R> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json() as R;
  } catch (error) {
    console.error(`Error posting data to ${url}:`, error);
    throw error;
  }
};

// Generic function to update data on the server
const updateData = async <T>(url: string, data: T): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error updating data at ${url}:`, error);
    throw error;
  }
};

// Generic function to patch data on the server
const patchData = async <T>(url: string, data: T): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error patching data at ${url}:`, error);
    throw error;
  }
};

// Generic function to delete data from the server
const deleteData = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error deleting data at ${url}:`, error);
    throw error;
  }
};

// Settings functions
export const getSettings = async (): Promise<SystemSettings> => {
  try {
    return await fetchData<SystemSettings>(API_ENDPOINTS.SETTINGS);
  } catch (error) {
    console.error('Error getting settings, using defaults:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    const result = await postData<SystemSettings, { success: boolean }>(
      API_ENDPOINTS.SETTINGS, 
      settings
    );
    return result.success;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Users functions
export const getUsers = async (): Promise<User[]> => {
  try {
    return await fetchData<User[]>(API_ENDPOINTS.USERS);
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const saveUser = async (user: User): Promise<boolean> => {
  try {
    const result = await postData<User, { success: boolean }>(
      API_ENDPOINTS.USERS, 
      user
    );
    return result.success;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
  try {
    return await patchData<Partial<User>>(
      `${API_ENDPOINTS.USERS}/${userId}`, 
      updates
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  return await updateUser(userId, { userRole: role });
};

export const updateEmailNotifications = async (userId: string, enabled: boolean): Promise<boolean> => {
  return await updateUser(userId, { emailNotifications: enabled });
};

export const incrementUnreadMessages = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/unread-messages/increment`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error incrementing unread messages:', error);
    return false;
  }
};

export const resetUnreadMessages = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/unread-messages/reset`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error resetting unread messages:', error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    return await deleteData(`${API_ENDPOINTS.USERS}/${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Events functions
export const getEvents = async (): Promise<Event[]> => {
  try {
    return await fetchData<Event[]>(API_ENDPOINTS.EVENTS);
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const saveEvent = async (event: Event): Promise<boolean> => {
  try {
    const result = await postData<Event, { success: boolean }>(
      API_ENDPOINTS.EVENTS, 
      event
    );
    return result.success;
  } catch (error) {
    console.error('Error saving event:', error);
    return false;
  }
};

export const updateEvent = async (event: Event): Promise<boolean> => {
  try {
    return await updateData<Event>(
      `${API_ENDPOINTS.EVENTS}/${event.id}`, 
      event
    );
  } catch (error) {
    console.error('Error updating event:', error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    return await deleteData(`${API_ENDPOINTS.EVENTS}/${eventId}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

// Messages functions
export const getMessages = async (): Promise<Message[]> => {
  try {
    return await fetchData<Message[]>(API_ENDPOINTS.MESSAGES);
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const getUserMessages = async (userId: string): Promise<Message[]> => {
  try {
    return await fetchData<Message[]>(`${API_ENDPOINTS.MESSAGES}?userId=${userId}`);
  } catch (error) {
    console.error('Error getting user messages:', error);
    return [];
  }
};

export const saveMessage = async (message: Message): Promise<boolean> => {
  try {
    const result = await postData<Message, { success: boolean }>(
      API_ENDPOINTS.MESSAGES, 
      message
    );
    return result.success;
  } catch (error) {
    console.error('Error saving message:', error);
    return false;
  }
};

export const saveMessages = async (messages: Message[]): Promise<boolean> => {
  try {
    const result = await postData<Message[], { success: boolean }>(
      `${API_ENDPOINTS.MESSAGES}/batch`, 
      messages
    );
    return result.success;
  } catch (error) {
    console.error('Error saving messages batch:', error);
    return false;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    return await patchData<{ read: boolean }>(
      `${API_ENDPOINTS.MESSAGES}/${messageId}`, 
      { read: true }
    );
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    return await deleteData(`${API_ENDPOINTS.MESSAGES}/${messageId}`);
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};
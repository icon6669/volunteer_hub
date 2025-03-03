import { Event, Message, SystemSettings, User, UserRole } from '../types';
import { defaultSettings } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

// Define the data directory and file paths
const DATA_DIR = '/home/project/data';

// In-memory cache for data
let settingsCache: SystemSettings | null = null;
let usersCache: User[] = [];
let eventsCache: Event[] = [];
let messagesCache: Message[] = [];

// Helper function to read data from a file
const readFile = async <T>(fileName: string, defaultValue: T): Promise<T> => {
  try {
    // In a browser environment, we need to use fetch to read files
    const response = await fetch(`${DATA_DIR}/${fileName}.json`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist yet, return default value
        return defaultValue;
      }
      throw new Error(`Failed to read ${fileName}.json: ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error reading ${fileName}.json:`, error);
    return defaultValue;
  }
};

// Helper function to write data to a file
const writeFile = async <T>(fileName: string, data: T): Promise<boolean> => {
  try {
    // In a browser environment, we need to use fetch to write files
    const response = await fetch(`${DATA_DIR}/${fileName}.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to write ${fileName}.json: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName}.json:`, error);
    return false;
  }
};

// Initialize data files if they don't exist
export const initializeStorage = async (): Promise<void> => {
  try {
    // Create data directory if it doesn't exist
    try {
      await fetch(`${DATA_DIR}`, { method: 'HEAD' });
    } catch (error) {
      // Directory doesn't exist, create it
      await fetch(`${DATA_DIR}`, { method: 'PUT' });
    }
    
    // Initialize settings file if it doesn't exist
    settingsCache = await readFile<SystemSettings>('settings', defaultSettings);
    
    // Initialize users file if it doesn't exist
    usersCache = await readFile<User[]>('users', []);
    
    // Initialize events file if it doesn't exist
    eventsCache = await readFile<Event[]>('events', []);
    
    // Initialize messages file if it doesn't exist
    messagesCache = await readFile<Message[]>('messages', []);
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Call initialization
initializeStorage();

// Settings functions
export const getSettings = async (): Promise<SystemSettings> => {
  if (!settingsCache) {
    settingsCache = await readFile<SystemSettings>('settings', defaultSettings);
  }
  return settingsCache;
};

export const saveSettings = async (settings: SystemSettings): Promise<boolean> => {
  const success = await writeFile('settings', settings);
  if (success) {
    settingsCache = settings;
  }
  return success;
};

// Users functions
export const getUsers = async (): Promise<User[]> => {
  if (usersCache.length === 0) {
    usersCache = await readFile<User[]>('users', []);
  }
  return usersCache;
};

export const saveUser = async (user: User): Promise<boolean> => {
  const users = await getUsers();
  const existingUserIndex = users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    // Update existing user
    users[existingUserIndex] = user;
  } else {
    // Add new user
    users.push(user);
  }
  
  const success = await writeFile('users', users);
  if (success) {
    usersCache = users;
  }
  return success;
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].userRole = role;
    const success = await writeFile('users', users);
    if (success) {
      usersCache = users;
    }
    return success;
  }
  
  return false;
};

export const updateEmailNotifications = async (userId: string, enabled: boolean): Promise<boolean> => {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].emailNotifications = enabled;
    const success = await writeFile('users', users);
    if (success) {
      usersCache = users;
    }
    return success;
  }
  
  return false;
};

export const incrementUnreadMessages = async (userId: string): Promise<boolean> => {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    const currentCount = users[userIndex].unreadMessages || 0;
    users[userIndex].unreadMessages = currentCount + 1;
    const success = await writeFile('users', users);
    if (success) {
      usersCache = users;
    }
    return success;
  }
  
  return false;
};

export const resetUnreadMessages = async (userId: string): Promise<boolean> => {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].unreadMessages = 0;
    const success = await writeFile('users', users);
    if (success) {
      usersCache = users;
    }
    return success;
  }
  
  return false;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const users = await getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (users.length !== filteredUsers.length) {
    const success = await writeFile('users', filteredUsers);
    if (success) {
      usersCache = filteredUsers;
    }
    return success;
  }
  
  return false;
};

export const transferOwnership = async (userId: string, newOwnerId: string): Promise<boolean> => {
  const users = await getUsers();
  const currentOwnerIndex = users.findIndex(u => u.id === userId);
  const newOwnerIndex = users.findIndex(u => u.id === newOwnerId);
  
  if (currentOwnerIndex >= 0 && newOwnerIndex >= 0) {
    // Update roles
    users[currentOwnerIndex].userRole = UserRole.MANAGER;
    users[newOwnerIndex].userRole = UserRole.OWNER;
    
    const success = await writeFile('users', users);
    if (success) {
      usersCache = users;
    }
    return success;
  }
  
  return false;
};

// Events functions
export const getEvents = async (): Promise<Event[]> => {
  if (eventsCache.length === 0) {
    eventsCache = await readFile<Event[]>('events', []);
  }
  return eventsCache;
};

export const saveEvent = async (event: Event): Promise<boolean> => {
  const events = await getEvents();
  const existingEventIndex = events.findIndex(e => e.id === event.id);
  
  if (existingEventIndex >= 0) {
    // Update existing event
    events[existingEventIndex] = event;
  } else {
    // Add new event
    events.push(event);
  }
  
  const success = await writeFile('events', events);
  if (success) {
    eventsCache = events;
  }
  return success;
};

export const updateEvent = async (event: Event): Promise<boolean> => {
  return await saveEvent(event);
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  const events = await getEvents();
  const filteredEvents = events.filter(e => e.id !== eventId);
  
  if (events.length !== filteredEvents.length) {
    const success = await writeFile('events', filteredEvents);
    if (success) {
      eventsCache = filteredEvents;
    }
    return success;
  }
  
  return false;
};

// Messages functions
export const getMessages = async (userId?: string): Promise<Message[]> => {
  if (messagesCache.length === 0) {
    messagesCache = await readFile<Message[]>('messages', []);
  }
  
  if (userId) {
    return messagesCache.filter(m => m.recipientId === userId || m.senderId === userId);
  }
  
  return messagesCache;
};

export const saveMessage = async (message: Message): Promise<boolean> => {
  const messages = await getMessages();
  const existingMessageIndex = messages.findIndex(m => m.id === message.id);
  
  if (existingMessageIndex >= 0) {
    // Update existing message
    messages[existingMessageIndex] = message;
  } else {
    // Add new message
    messages.push(message);
  }
  
  const success = await writeFile('messages', messages);
  if (success) {
    messagesCache = messages;
  }
  return success;
};

export const saveMessages = async (newMessages: Message[]): Promise<boolean> => {
  const messages = await getMessages();
  const updatedMessages = [...messages, ...newMessages];
  
  const success = await writeFile('messages', updatedMessages);
  if (success) {
    messagesCache = updatedMessages;
  }
  return success;
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  const messages = await getMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex >= 0) {
    messages[messageIndex].read = true;
    const success = await writeFile('messages', messages);
    if (success) {
      messagesCache = messages;
    }
    return success;
  }
  
  return false;
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  const messages = await getMessages();
  const filteredMessages = messages.filter(m => m.id !== messageId);
  
  if (messages.length !== filteredMessages.length) {
    const success = await writeFile('messages', filteredMessages);
    if (success) {
      messagesCache = filteredMessages;
    }
    return success;
  }
  
  return false;
};
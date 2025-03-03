import { Event, Message, SystemSettings, User, UserRole } from '../types';
import { defaultSettings } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Define the data directory
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure the data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create data directory:', error);
}

// File paths for different data types
const FILES = {
  SETTINGS: path.join(DATA_DIR, 'settings.json'),
  USERS: path.join(DATA_DIR, 'users.json'),
  EVENTS: path.join(DATA_DIR, 'events.json'),
  MESSAGES: path.join(DATA_DIR, 'messages.json'),
};

// Generic function to read data from a file
const readData = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading from ${filePath}:`, error);
    return defaultValue;
  }
};

// Generic function to write data to a file
const writeData = <T>(filePath: string, data: T): boolean => {
  try {
    // Ensure data is serializable by removing any Symbol properties
    const safeData = JSON.parse(JSON.stringify(data));
    fs.writeFileSync(filePath, JSON.stringify(safeData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// Settings functions
export const getSettings = (): SystemSettings => {
  return readData<SystemSettings>(FILES.SETTINGS, defaultSettings);
};

export const saveSettings = (settings: SystemSettings): boolean => {
  return writeData<SystemSettings>(FILES.SETTINGS, settings);
};

// Users functions
export const getUsers = (): User[] => {
  return readData<User[]>(FILES.USERS, []);
};

export const saveUser = (user: User): boolean => {
  const users = getUsers();
  const existingUserIndex = users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    // Update existing user
    users[existingUserIndex] = user;
  } else {
    // Add new user
    users.push(user);
  }
  
  return writeData<User[]>(FILES.USERS, users);
};

export const updateUserRole = (userId: string, role: UserRole): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].userRole = role;
    return writeData<User[]>(FILES.USERS, users);
  }
  
  return false;
};

export const transferOwnership = (userId: string, newOwnerId: string): boolean => {
  const users = getUsers();
  const currentOwnerIndex = users.findIndex(u => u.id === userId);
  const newOwnerIndex = users.findIndex(u => u.id === newOwnerId);
  
  if (currentOwnerIndex >= 0 && newOwnerIndex >= 0) {
    // Update roles
    users[currentOwnerIndex].userRole = UserRole.MANAGER;
    users[newOwnerIndex].userRole = UserRole.OWNER;
    
    return writeData<User[]>(FILES.USERS, users);
  }
  
  return false;
};

export const updateEmailNotifications = (userId: string, enabled: boolean): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].emailNotifications = enabled;
    return writeData<User[]>(FILES.USERS, users);
  }
  
  return false;
};

export const incrementUnreadMessages = (userId: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    const currentCount = users[userIndex].unreadMessages || 0;
    users[userIndex].unreadMessages = currentCount + 1;
    return writeData<User[]>(FILES.USERS, users);
  }
  
  return false;
};

export const resetUnreadMessages = (userId: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].unreadMessages = 0;
    return writeData<User[]>(FILES.USERS, users);
  }
  
  return false;
};

export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (users.length !== filteredUsers.length) {
    return writeData<User[]>(FILES.USERS, filteredUsers);
  }
  
  return false;
};

// Events functions
export const getEvents = (): Event[] => {
  return readData<Event[]>(FILES.EVENTS, []);
};

export const saveEvent = (event: Event): boolean => {
  const events = getEvents();
  const existingEventIndex = events.findIndex(e => e.id === event.id);
  
  if (existingEventIndex >= 0) {
    // Update existing event
    events[existingEventIndex] = event;
  } else {
    // Add new event
    events.push(event);
  }
  
  return writeData<Event[]>(FILES.EVENTS, events);
};

export const updateEvent = (event: Event): boolean => {
  return saveEvent(event);
};

export const deleteEvent = (eventId: string): boolean => {
  const events = getEvents();
  const filteredEvents = events.filter(e => e.id !== eventId);
  
  if (events.length !== filteredEvents.length) {
    return writeData<Event[]>(FILES.EVENTS, filteredEvents);
  }
  
  return false;
};

// Messages functions
export const getMessages = (userId?: string): Message[] => {
  const messages = readData<Message[]>(FILES.MESSAGES, []);
  
  if (userId) {
    return messages.filter(m => m.recipientId === userId || m.senderId === userId);
  }
  
  return messages;
};

export const saveMessage = (message: Message): boolean => {
  const messages = getMessages();
  const existingMessageIndex = messages.findIndex(m => m.id === message.id);
  
  if (existingMessageIndex >= 0) {
    // Update existing message
    messages[existingMessageIndex] = message;
  } else {
    // Add new message
    messages.push(message);
  }
  
  return writeData<Message[]>(FILES.MESSAGES, messages);
};

export const saveMessages = (newMessages: Message[]): boolean => {
  const messages = getMessages();
  const updatedMessages = [...messages, ...newMessages];
  
  return writeData<Message[]>(FILES.MESSAGES, updatedMessages);
};

export const markMessageAsRead = (messageId: string): boolean => {
  const messages = getMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex >= 0) {
    messages[messageIndex].read = true;
    return writeData<Message[]>(FILES.MESSAGES, messages);
  }
  
  return false;
};

export const deleteMessage = (messageId: string): boolean => {
  const messages = getMessages();
  const filteredMessages = messages.filter(m => m.id !== messageId);
  
  if (messages.length !== filteredMessages.length) {
    return writeData<Message[]>(FILES.MESSAGES, filteredMessages);
  }
  
  return false;
};
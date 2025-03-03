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
const readData = (filePath, defaultValue) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading from ${filePath}:`, error);
    return defaultValue;
  }
};

// Generic function to write data to a file
const writeData = (filePath, data) => {
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
export const getSettings = (defaultSettings) => {
  return readData(FILES.SETTINGS, defaultSettings);
};

export const saveSettings = (settings) => {
  return writeData(FILES.SETTINGS, settings);
};

// Users functions
export const getUsers = () => {
  return readData(FILES.USERS, []);
};

export const saveUser = (user) => {
  const users = getUsers();
  const existingUserIndex = users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    // Update existing user
    users[existingUserIndex] = user;
  } else {
    // Add new user
    users.push(user);
  }
  
  return writeData(FILES.USERS, users);
};

export const updateUser = (userId, updates) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex] = { ...users[userIndex], ...updates };
    return writeData(FILES.USERS, users);
  }
  
  return false;
};

// Events functions
export const getEvents = () => {
  return readData(FILES.EVENTS, []);
};

export const saveEvent = (event) => {
  const events = getEvents();
  const existingEventIndex = events.findIndex(e => e.id === event.id);
  
  if (existingEventIndex >= 0) {
    // Update existing event
    events[existingEventIndex] = event;
  } else {
    // Add new event
    events.push(event);
  }
  
  return writeData(FILES.EVENTS, events);
};

export const deleteEvent = (eventId) => {
  const events = getEvents();
  const filteredEvents = events.filter(e => e.id !== eventId);
  
  if (events.length !== filteredEvents.length) {
    return writeData(FILES.EVENTS, filteredEvents);
  }
  
  return false;
};

// Messages functions
export const getMessages = () => {
  return readData(FILES.MESSAGES, []);
};

export const saveMessage = (message) => {
  const messages = getMessages();
  const existingMessageIndex = messages.findIndex(m => m.id === message.id);
  
  if (existingMessageIndex >= 0) {
    // Update existing message
    messages[existingMessageIndex] = message;
  } else {
    // Add new message
    messages.push(message);
  }
  
  return writeData(FILES.MESSAGES, messages);
};

export const saveMessages = (newMessages) => {
  const messages = getMessages();
  const updatedMessages = [...messages, ...newMessages];
  return writeData(FILES.MESSAGES, updatedMessages);
};

export const updateMessage = (messageId, updates) => {
  const messages = getMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex >= 0) {
    messages[messageIndex] = { ...messages[messageIndex], ...updates };
    return writeData(FILES.MESSAGES, messages);
  }
  
  return false;
};

export const deleteMessage = (messageId) => {
  const messages = getMessages();
  const filteredMessages = messages.filter(m => m.id !== messageId);
  
  if (messages.length !== filteredMessages.length) {
    return writeData(FILES.MESSAGES, filteredMessages);
  }
  
  return false;
};
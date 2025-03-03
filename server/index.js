import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the data directory
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure the data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory at ${DATA_DIR}`);
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

// Default settings
const defaultSettings = {
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

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const settings = readData(FILES.SETTINGS, defaultSettings);
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const settings = req.body;
  const success = writeData(FILES.SETTINGS, settings);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Users endpoints
app.get('/api/users', (req, res) => {
  const users = readData(FILES.USERS, []);
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  const users = readData(FILES.USERS, []);
  const existingUserIndex = users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    // Update existing user
    users[existingUserIndex] = user;
  } else {
    // Add new user
    users.push(user);
  }
  
  const success = writeData(FILES.USERS, users);
  
  if (success) {
    res.status(201).json({ success: true, user });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save user' });
  }
});

app.patch('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  const users = readData(FILES.USERS, []);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex] = { ...users[userIndex], ...updates };
    const success = writeData(FILES.USERS, users);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// Special endpoint for incrementing unread messages
app.patch('/api/users/:id/unread-messages/increment', (req, res) => {
  const userId = req.params.id;
  const users = readData(FILES.USERS, []);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    const currentCount = users[userIndex].unreadMessages || 0;
    users[userIndex].unreadMessages = currentCount + 1;
    
    const success = writeData(FILES.USERS, users);
    
    if (success) {
      res.status(200).json({ 
        success: true, 
        unreadMessages: users[userIndex].unreadMessages 
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to increment unread messages' });
    }
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// Special endpoint for resetting unread messages
app.patch('/api/users/:id/unread-messages/reset', (req, res) => {
  const userId = req.params.id;
  const users = readData(FILES.USERS, []);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].unreadMessages = 0;
    
    const success = writeData(FILES.USERS, users);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to reset unread messages' });
    }
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const users = readData(FILES.USERS, []);
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (users.length !== filteredUsers.length) {
    const success = writeData(FILES.USERS, filteredUsers);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// Events endpoints
app.get('/api/events', (req, res) => {
  const events = readData(FILES.EVENTS, []);
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const event = req.body;
  const events = readData(FILES.EVENTS, []);
  const existingEventIndex = events.findIndex(e => e.id === event.id);
  
  if (existingEventIndex >= 0) {
    // Update existing event
    events[existingEventIndex] = event;
  } else {
    // Add new event
    events.push(event);
  }
  
  const success = writeData(FILES.EVENTS, events);
  
  if (success) {
    res.status(201).json({ success: true, event });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save event' });
  }
});

app.put('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const event = req.body;
  
  if (event.id !== eventId) {
    return res.status(400).json({ success: false, error: 'Event ID mismatch' });
  }
  
  const events = readData(FILES.EVENTS, []);
  const existingEventIndex = events.findIndex(e => e.id === eventId);
  
  if (existingEventIndex >= 0) {
    // Update existing event
    events[existingEventIndex] = event;
  } else {
    // Add new event
    events.push(event);
  }
  
  const success = writeData(FILES.EVENTS, events);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const events = readData(FILES.EVENTS, []);
  const filteredEvents = events.filter(e => e.id !== eventId);
  
  if (events.length !== filteredEvents.length) {
    const success = writeData(FILES.EVENTS, filteredEvents);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete event' });
    }
  } else {
    res.status(404).json({ success: false, error: 'Event not found' });
  }
});

// Messages endpoints
app.get('/api/messages', (req, res) => {
  const userId = req.query.userId;
  const messages = readData(FILES.MESSAGES, []);
  
  if (userId) {
    const userMessages = messages.filter(
      m => m.recipientId === userId || m.senderId === userId
    );
    res.json(userMessages);
  } else {
    res.json(messages);
  }
});

app.post('/api/messages', (req, res) => {
  const message = req.body;
  const messages = readData(FILES.MESSAGES, []);
  const existingMessageIndex = messages.findIndex(m => m.id === message.id);
  
  if (existingMessageIndex >= 0) {
    // Update existing message
    messages[existingMessageIndex] = message;
  } else {
    // Add new message
    messages.push(message);
  }
  
  const success = writeData(FILES.MESSAGES, messages);
  
  if (success) {
    res.status(201).json({ success: true, message });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save message' });
  }
});

app.post('/api/messages/batch', (req, res) => {
  const newMessages = req.body;
  const messages = readData(FILES.MESSAGES, []);
  const updatedMessages = [...messages, ...newMessages];
  
  const success = writeData(FILES.MESSAGES, updatedMessages);
  
  if (success) {
    res.status(201).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save messages' });
  }
});

app.patch('/api/messages/:id', (req, res) => {
  const messageId = req.params.id;
  const updates = req.body;
  const messages = readData(FILES.MESSAGES, []);
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex >= 0) {
    messages[messageIndex] = { ...messages[messageIndex], ...updates };
    const success = writeData(FILES.MESSAGES, messages);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update message' });
    }
  } else {
    res.status(404).json({ success: false, error: 'Message not found' });
  }
});

app.delete('/api/messages/:id', (req, res) => {
  const messageId = req.params.id;
  const messages = readData(FILES.MESSAGES, []);
  const filteredMessages = messages.filter(m => m.id !== messageId);
  
  if (messages.length !== filteredMessages.length) {
    const success = writeData(FILES.MESSAGES, filteredMessages);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
  } else {
    res.status(404).json({ success: false, error: 'Message not found' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle any requests that don't match the above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
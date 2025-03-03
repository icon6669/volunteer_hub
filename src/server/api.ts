import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as storage from './storage.js';
import { defaultSettings } from '../supabase.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const settings = storage.getSettings(defaultSettings);
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const settings = req.body;
  const success = storage.saveSettings(settings);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Users endpoints
app.get('/api/users', (req, res) => {
  const users = storage.getUsers();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  const success = storage.saveUser(user);
  
  if (success) {
    res.status(201).json({ success: true, user });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save user' });
  }
});

app.patch('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  const success = storage.updateUser(userId, updates);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// Events endpoints
app.get('/api/events', (req, res) => {
  const events = storage.getEvents();
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const event = req.body;
  const success = storage.saveEvent(event);
  
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
  
  const success = storage.saveEvent(event);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const success = storage.deleteEvent(eventId);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Event not found' });
  }
});

// Messages endpoints
app.get('/api/messages', (req, res) => {
  const userId = req.query.userId;
  const messages = storage.getMessages();
  
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
  const success = storage.saveMessage(message);
  
  if (success) {
    res.status(201).json({ success: true, message });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save message' });
  }
});

app.post('/api/messages/batch', (req, res) => {
  const messages = req.body;
  const success = storage.saveMessages(messages);
  
  if (success) {
    res.status(201).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save messages' });
  }
});

app.patch('/api/messages/:id', (req, res) => {
  const messageId = req.params.id;
  const updates = req.body;
  const success = storage.updateMessage(messageId, updates);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Message not found' });
  }
});

app.delete('/api/messages/:id', (req, res) => {
  const messageId = req.params.id;
  const success = storage.deleteMessage(messageId);
  
  if (success) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Message not found' });
  }
});

// Start the server
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Export for use in other files
export { startServer };

// Auto-start if this file is run directly
if (require.main === module) {
  startServer();
}
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageFormData, MessageRecipientType } from '../types';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';
import * as api from '../api';

interface MessageContextType {
  messages: Message[];
  sendMessage: (messageData: MessageFormData) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  getUserMessages: (userId: string) => Message[];
  getUnreadCount: (userId: string) => number;
  isLoading: boolean;
  error: string | null;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, users, incrementUnreadMessages } = useAuth();
  const { events } = useAppContext();

  // Load messages from server
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch messages for the current user
        const fetchedMessages = await api.fetchMessages(user.id);
        setMessages(fetchedMessages);
      } catch (err) {
        console.error('Error loading messages:', err instanceof Error ? err.message : 'Unknown error');
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [user]);

  const sendMessage = async (messageData: MessageFormData): Promise<boolean> => {
    if (!user) return false;

    const { recipientType, recipientId, eventId, roleId, subject, content } = messageData;
    const timestamp = new Date().toISOString();
    
    let recipientIds: string[] = [];

    switch (recipientType) {
      case MessageRecipientType.INDIVIDUAL:
        if (recipientId) {
          recipientIds = [recipientId];
        }
        break;
      
      case MessageRecipientType.EVENT:
        if (eventId) {
          const event = events.find(e => e.id === eventId);
          if (event) {
            // Get all unique volunteer IDs from this event
            const volunteerEmails = new Set<string>();
            event.roles.forEach(role => {
              role.volunteers.forEach(volunteer => {
                volunteerEmails.add(volunteer.email);
              });
            });
            
            // Find user IDs matching these emails
            recipientIds = users
              .filter(u => volunteerEmails.has(u.email))
              .map(u => u.id);
          }
        }
        break;
      
      case MessageRecipientType.ROLE:
        if (eventId && roleId) {
          const event = events.find(e => e.id === eventId);
          if (event) {
            const role = event.roles.find(r => r.id === roleId);
            if (role) {
              // Get all volunteer emails from this role
              const volunteerEmails = role.volunteers.map(v => v.email);
              
              // Find user IDs matching these emails
              recipientIds = users
                .filter(u => volunteerEmails.includes(u.email))
                .map(u => u.id);
            }
          }
        }
        break;
      
      case MessageRecipientType.ALL:
        // Send to all volunteers
        recipientIds = users
          .filter(u => u.id !== user.id)
          .map(u => u.id);
        break;
    }

    try {
      // Create a new message for each recipient
      const newMessages: Message[] = recipientIds.map(recipientId => ({
        id: uuidv4(),
        senderId: user.id,
        recipientId: recipientId,
        subject,
        content,
        timestamp,
        read: false
      }));

      if (newMessages.length > 0) {
        // Save messages to server
        const success = await api.saveMessages(newMessages);
        
        if (success) {
          // Update local state
          setMessages(prev => [...prev, ...newMessages]);
          
          // Increment unread count for each recipient
          for (const id of recipientIds) {
            await incrementUnreadMessages(id);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error sending messages:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const markAsRead = async (messageId: string): Promise<boolean> => {
    try {
      // Mark message as read on server
      const success = await api.markMessageAsRead(messageId);
      
      if (success) {
        // Update local state
        setMessages(prev => 
          prev.map(message => 
            message.id === messageId ? { ...message, read: true } : message
          )
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error marking message as read:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      // Delete message on server
      const success = await api.deleteMessage(messageId);
      
      if (success) {
        // Update local state
        setMessages(prev => prev.filter(message => message.id !== messageId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting message:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const getUserMessages = (userId: string): Message[] => {
    return messages.filter(message => message.recipientId === userId);
  };

  const getUnreadCount = (userId: string): number => {
    return messages.filter(message => message.recipientId === userId && !message.read).length;
  };

  return (
    <MessageContext.Provider
      value={{
        messages,
        sendMessage,
        markAsRead,
        deleteMessage,
        getUserMessages,
        getUnreadCount,
        isLoading,
        error
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
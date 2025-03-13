import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, MessageFormData, MessageRecipientType } from '../types';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';
import { services } from '../services';
import { Database } from '../types/supabase';
import { supabase } from '../lib/supabase';

type DbUser = Database['public']['Tables']['users']['Row'];

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
  const [users, setUsers] = useState<DbUser[]>([]);

  const { user } = useAuth();
  const { events } = useAppContext();

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) throw error;
        if (data) setUsers(data);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };
    
    loadUsers();
  }, []);

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
        
        // Fetch messages for the current user using MessageService
        const fetchedMessages = await services.messages.getMessages(user.id);
        
        // Transform database messages to application Message type
        const transformedMessages: Message[] = fetchedMessages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          eventId: msg.event_id,
          recipientId: '',  // Default empty string for optional properties
          subject: '',      // Default empty string for optional properties
          content: msg.content,
          timestamp: msg.created_at,
          read: false
        }));
        
        setMessages(transformedMessages);
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

    const { recipientType, recipientId, eventId, roleId, content } = messageData;
    
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
            event.roles?.forEach(role => {
              role.volunteers?.forEach(volunteer => {
                volunteerEmails.add(volunteer.email);
              });
            });
            
            // Find user IDs matching these emails
            recipientIds = users
              .filter((u: DbUser) => volunteerEmails.has(u.email))
              .map((u: DbUser) => u.id);
          }
        }
        break;
      
      case MessageRecipientType.ROLE:
        if (eventId && roleId) {
          const event = events.find(e => e.id === eventId);
          if (event) {
            const role = event.roles?.find(r => r.id === roleId);
            if (role) {
              // Get all volunteer emails from this role
              const volunteerEmails = role.volunteers?.map(v => v.email) || [];
              
              // Find user IDs matching these emails
              recipientIds = users
                .filter((u: DbUser) => volunteerEmails.includes(u.email))
                .map((u: DbUser) => u.id);
            }
          }
        }
        break;
      
      case MessageRecipientType.ALL:
        // Send to all volunteers
        recipientIds = users
          .filter((u: DbUser) => u.id !== user.id)
          .map((u: DbUser) => u.id);
        break;
    }

    try {
      // Create a new message for each recipient
      const messagesToSave = recipientIds.map(recipientId => ({
        senderId: user.id,
        eventId: eventId || '',
        recipientId,
        content
      }));

      if (messagesToSave.length > 0) {
        // Save messages to server using MessageService
        const success = await services.messages.saveMessages(messagesToSave);
        
        if (success) {
          // Reload messages to get the updated list
          const updatedMessages = await services.messages.getMessages(user.id);
          
          // Transform database messages to application Message type
          const transformedMessages: Message[] = updatedMessages.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            eventId: msg.event_id,
            recipientId: '',  // Default empty string for optional properties
            subject: '',      // Default empty string for optional properties
            content: msg.content,
            timestamp: msg.created_at,
            read: false
          }));
          
          setMessages(transformedMessages);
          
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
      // Mark message as read on server using MessageService
      const success = await services.messages.markAsRead(messageId);
      
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
      // Delete message on server using MessageService
      const success = await services.messages.deleteMessage(messageId);
      
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
    return messages.filter(message => message.senderId === userId);
  };

  const getUnreadCount = (userId: string): number => {
    return messages.filter(message => message.senderId === userId && !message.read).length;
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
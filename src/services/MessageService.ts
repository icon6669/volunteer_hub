import { BaseService } from './BaseService';
import { Database } from '../types/supabase';

type DbMessage = Database['public']['Tables']['messages']['Row'];

export class MessageService extends BaseService {
  private readonly TABLE = 'messages';

  async getMessages(userId: string): Promise<DbMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .or(`sender_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  async saveMessage(message: {
    senderId: string;
    eventId: string;
    content: string;
    recipientId?: string;
    subject?: string;
  }): Promise<DbMessage | null> {
    try {
      const dbMessage = {
        id: crypto.randomUUID(),
        sender_id: message.senderId,
        event_id: message.eventId,
        content: message.content,
        recipient_id: message.recipientId || null,
        subject: message.subject || null,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from(this.TABLE)
        .insert([dbMessage])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  async saveMessages(messages: {
    senderId: string;
    eventId: string;
    content: string;
    recipientId?: string;
    subject?: string;
  }[]): Promise<boolean> {
    try {
      const dbMessages = messages.map(message => ({
        id: crypto.randomUUID(),
        sender_id: message.senderId,
        event_id: message.eventId,
        content: message.content,
        recipient_id: message.recipientId || null,
        subject: message.subject || null,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from(this.TABLE)
        .insert(dbMessages);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving messages:', error);
      return false;
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE)
        .update({ read: true })
        .eq('id', messageId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE)
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
}

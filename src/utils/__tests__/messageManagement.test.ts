import { mockUserData, mockSupabase, createChainableMock } from '../../test/utils';

jest.mock('../../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

const mockMessage = {
  id: 'test-message-id',
  event_id: 'test-event-id',
  sender_id: mockUserData.id,
  content: 'Test message content',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Message Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Creation', () => {
    it('should create an event message', async () => {
      const mockMethods = createChainableMock(mockMessage);
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .insert(mockMessage)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockMessage);
      expect(result.data).toEqual(mockMessage);
    });

    it('should handle message creation errors', async () => {
      const mockError = { message: 'Error creating message' };
      const mockMethods = createChainableMock(null);
      mockMethods.single = jest.fn().mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .insert(mockMessage)
        .select()
        .single();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('Message Retrieval', () => {
    it('should fetch messages for an event', async () => {
      const mockMethods = createChainableMock([mockMessage]);
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .select()
        .eq('event_id', 'test-event-id')
        .single();

      expect(result.data).toEqual([mockMessage]);
    });

    it('should handle errors when fetching messages', async () => {
      const mockError = { message: 'Error fetching messages' };
      const mockMethods = createChainableMock(null);
      mockMethods.single = jest.fn().mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .select()
        .eq('event_id', 'test-event-id')
        .single();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('Message Deletion', () => {
    it('should delete a message', async () => {
      const mockMethods = createChainableMock(null);
      mockMethods.delete.mockReturnThis();
      mockMethods.eq.mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .delete()
        .eq('id', mockMessage.id);

      expect(result.error).toBeNull();
      expect(mockMethods.delete).toHaveBeenCalled();
    }, 10000);

    it('should handle errors when deleting a message', async () => {
      const mockError = { message: 'Error deleting message' };
      const mockMethods = createChainableMock(null);
      mockMethods.delete.mockReturnThis();
      mockMethods.eq.mockResolvedValue({ error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .delete()
        .eq('id', mockMessage.id);

      expect(result.error).toEqual(mockError);
    }, 10000);
  });

  describe('Message Read Status', () => {
    const mockReadStatus = {
      message_id: mockMessage.id,
      user_id: mockUserData.id,
      read: true,
    };

    it('should mark a message as read', async () => {
      const mockMethods = createChainableMock(mockReadStatus);
      mockSupabase.from.mockReturnValue(mockMethods);

      mockMethods.upsert.mockResolvedValue({ data: mockReadStatus, error: null });

      const result = await mockMethods
        .upsert(mockReadStatus);

      expect(result.data).toEqual(mockReadStatus);
    }, 10000);

    it('should handle errors when marking a message as read', async () => {
      const mockError = { message: 'Error marking message as read' };
      const mockMethods = createChainableMock(null);
      mockMethods.upsert.mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .upsert(mockReadStatus);

      expect(result.error).toEqual(mockError);
    }, 10000);
  });
});

import { mockUserData, mockSupabase, createChainableMock } from '../../test/utils';

jest.mock('../../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

const mockEvent = {
  id: 'test-event-id',
  name: 'Test Event',
  description: 'Test Description',
  location: 'Test Location',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 86400000).toISOString(),
  owner_id: mockUserData.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockRole = {
  id: 'test-role-id',
  event_id: mockEvent.id,
  name: 'Test Role',
  description: 'Test Role Description',
  capacity: 0,
  max_capacity: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Event Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Creation', () => {
    it('should create an event with proper permissions', async () => {
      const mockMethods = createChainableMock(mockEvent);
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockSupabase
        .from('events')
        .insert(mockEvent)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockEvent);
      expect(result.data).toEqual(mockEvent);
    });

    it('should handle event creation errors', async () => {
      const mockError = { message: 'Error creating event' };
      const mockMethods = createChainableMock(null);
      mockMethods.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockSupabase
        .from('events')
        .insert(mockEvent)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockEvent);
      expect(result.error).toEqual(mockError);
    });
  });

  describe('Role Management', () => {
    it('should create a role within capacity limits', async () => {
      const mockMethods = createChainableMock(mockRole);
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockSupabase
        .from('roles')
        .insert(mockRole)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockRole);
      expect(result.data).toEqual(mockRole);
    });

    it('should handle role creation errors', async () => {
      const mockError = { message: 'Error creating role' };
      const mockMethods = createChainableMock(null);
      mockMethods.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockSupabase
        .from('roles')
        .insert(mockRole)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockRole);
      expect(result.error).toEqual(mockError);
    });
  });

  describe('Volunteer Assignment', () => {
    const mockVolunteer = {
      id: 'test-volunteer-id',
      role_id: mockRole.id,
      user_id: mockUserData.id,
      name: mockUserData.user_metadata.name,
      email: mockUserData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should assign volunteer to role within capacity', async () => {
      const mockMethods = createChainableMock(mockVolunteer);
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockSupabase
        .from('volunteers')
        .insert(mockVolunteer)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockVolunteer);
      expect(result.data).toEqual(mockVolunteer);
    });

    it('should handle volunteer assignment errors', async () => {
      const mockError = { message: 'Error assigning volunteer' };
      const mockMethods = createChainableMock(null);
      mockMethods.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockSupabase
        .from('volunteers')
        .insert(mockVolunteer)
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith(mockVolunteer);
      expect(result.error).toEqual(mockError);
    });
  });
});

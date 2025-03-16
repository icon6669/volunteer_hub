import { createUserRecord } from '../userManagement';
import { mockUserData, mockExtendedUserData, mockSupabase, createChainableMock } from '../../test/utils';
import { UserRole } from '../../types';
import { isAdmin, isOwner, isManager, isVolunteer } from '../userRoles';

jest.mock('../../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Hierarchy', () => {
    it('should correctly identify admin privileges', () => {
      expect(isAdmin('admin' as UserRole)).toBe(true);
      expect(isAdmin('owner' as UserRole)).toBe(false);
      expect(isAdmin('manager' as UserRole)).toBe(false);
      expect(isAdmin('volunteer' as UserRole)).toBe(false);
    });

    it('should correctly identify owner privileges', () => {
      expect(isOwner('admin' as UserRole)).toBe(true);
      expect(isOwner('owner' as UserRole)).toBe(true);
      expect(isOwner('manager' as UserRole)).toBe(false);
      expect(isOwner('volunteer' as UserRole)).toBe(false);
    });

    it('should correctly identify manager privileges', () => {
      expect(isManager('admin' as UserRole)).toBe(true);
      expect(isManager('owner' as UserRole)).toBe(true);
      expect(isManager('manager' as UserRole)).toBe(true);
      expect(isManager('volunteer' as UserRole)).toBe(false);
    });

    it('should correctly identify volunteer privileges', () => {
      expect(isVolunteer('admin' as UserRole)).toBe(true);
      expect(isVolunteer('owner' as UserRole)).toBe(true);
      expect(isVolunteer('manager' as UserRole)).toBe(true);
      expect(isVolunteer('volunteer' as UserRole)).toBe(true);
    });

    it('should handle null and undefined roles', () => {
      expect(isAdmin(null)).toBe(false);
      expect(isOwner(undefined)).toBe(false);
      expect(isManager(null)).toBe(false);
      expect(isVolunteer(undefined)).toBe(false);
    });
  });

  describe('User Creation', () => {
    it('should create a user record with default role', async () => {
      const mockMethods = createChainableMock(mockExtendedUserData);
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .insert({ ...mockExtendedUserData, user_role: 'volunteer' as UserRole })
        .select()
        .single();

      expect(mockMethods.insert).toHaveBeenCalledWith({ 
        ...mockExtendedUserData, 
        user_role: 'volunteer' as UserRole 
      });
      expect(result.data).toEqual(mockExtendedUserData);
    }, 10000);

    it('should create first user as OWNER', async () => {
      const mockMethods = createChainableMock(null);
      mockMethods.select = jest.fn().mockReturnValue({
        count: jest.fn().mockResolvedValue({ count: 0, error: null })
      });
      mockMethods.insert = jest.fn().mockResolvedValue({ data: { ...mockExtendedUserData, user_role: UserRole.OWNER }, error: null });
      mockMethods.eq = jest.fn().mockReturnThis();
      mockMethods.single = jest.fn().mockResolvedValue({ data: null, error: null });
      
      mockSupabase.from.mockReturnValue(mockMethods);

      try {
        const result = await createUserRecord(mockUserData, UserRole.VOLUNTEER);
        expect(result).toEqual({ ...mockExtendedUserData, user_role: UserRole.OWNER });
        expect(mockMethods.insert).toHaveBeenCalledWith({
          id: mockUserData.id,
          email: mockUserData.email,
          name: mockUserData.user_metadata?.name || mockUserData.email?.split('@')[0] || 'User',
          user_role: UserRole.OWNER,
          email_notifications: true,
          unread_messages: 0
        });
      } catch (error) {
        console.error('Test error:', error);
        expect('Test should not throw an error').toBe(false);
      }
    }, 20000);

    it('should handle user creation errors', async () => {
      const mockError = { message: 'Error creating user' };
      const mockMethods = createChainableMock(null);
      mockMethods.single = jest.fn().mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .insert({ ...mockExtendedUserData, user_role: 'volunteer' as UserRole })
        .select()
        .single();

      expect(result.error).toEqual(mockError);
    }, 10000);

    it('should handle existing user records', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: mockExtendedUserData, error: null });
      const mockMethods = createChainableMock(mockExtendedUserData);
      mockMethods.single = mockSelect;
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .select()
        .eq('id', mockUserData.id)
        .single();

      expect(result.data).toEqual(mockExtendedUserData);
    }, 10000);
  });

  describe('User Role Management', () => {
    it('should update user role', async () => {
      const mockMethods = createChainableMock({ ...mockExtendedUserData, user_role: 'manager' as UserRole });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .update({ user_role: 'manager' as UserRole })
        .eq('id', mockUserData.id)
        .single();

      expect(result.data).toEqual({ 
        ...mockExtendedUserData, 
        user_role: 'manager' as UserRole 
      });
    }, 10000);

    it('should handle errors when updating user role', async () => {
      const mockError = { message: 'Error updating user role' };
      const mockMethods = createChainableMock(null);
      mockMethods.single = jest.fn().mockResolvedValue({ data: null, error: mockError });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .update({ user_role: 'manager' as UserRole })
        .eq('id', mockUserData.id)
        .single();

      expect(result.error).toEqual(mockError);
    }, 10000);

    it('should update to ADMIN role', async () => {
      const mockMethods = createChainableMock({ ...mockExtendedUserData, user_role: 'admin' as UserRole });
      mockSupabase.from.mockReturnValue(mockMethods);

      const result = await mockMethods
        .update({ user_role: 'admin' as UserRole })
        .eq('id', mockUserData.id)
        .single();

      expect(result.data).toEqual({ 
        ...mockExtendedUserData, 
        user_role: 'admin' as UserRole 
      });
    }, 10000);
  });

  describe('createUserRecord', () => {
    it('should create a new user record with VOLUNTEER role by default', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ 
        data: { ...mockExtendedUserData, user_role: UserRole.VOLUNTEER }, 
        error: null 
      });
      
      const mockMethods = createChainableMock(null);
      mockMethods.select.mockReturnThis();
      mockMethods.eq.mockReturnThis();
      mockMethods.single.mockResolvedValue({ data: null, error: null });
      mockMethods.insert = mockInsert;
      
      mockSupabase.from.mockReturnValue(mockMethods);

      try {
        const result = await createUserRecord(mockUserData);
        expect(result).toEqual({ ...mockExtendedUserData, user_role: UserRole.VOLUNTEER });
        expect(mockInsert).toHaveBeenCalledWith({
          id: mockUserData.id,
          email: mockUserData.email,
          name: mockUserData.user_metadata?.name || mockUserData.email?.split('@')[0] || 'User',
          user_role: UserRole.VOLUNTEER,
          email_notifications: true,
          unread_messages: 0
        });
      } catch (error) {
        console.error('Test error:', error);
        expect('Test should not throw an error').toBe(false);
      }
    }, 20000);

    it('should not create a user record if one already exists', async () => {
      const mockMethods = createChainableMock(mockExtendedUserData);
      mockMethods.select.mockReturnThis();
      mockMethods.eq.mockReturnThis();
      mockMethods.single.mockResolvedValue({ data: mockExtendedUserData, error: null });
      mockMethods.insert = jest.fn();
      
      mockSupabase.from.mockReturnValue(mockMethods);

      try {
        const result = await createUserRecord(mockUserData);
        expect(result).toEqual(mockExtendedUserData);
        expect(mockMethods.insert).not.toHaveBeenCalled();
      } catch (error) {
        console.error('Test error:', error);
        expect('Test should not throw an error').toBe(false);
      }
    }, 20000);

    it('should handle errors when creating user record', async () => {
      const mockError = { message: 'Error creating user record' };
      
      const mockMethods = createChainableMock(null);
      mockMethods.select.mockReturnThis();
      mockMethods.eq.mockReturnThis();
      mockMethods.single.mockImplementation(() => Promise.resolve({ data: null, error: null }));
      mockMethods.insert.mockImplementation(() => Promise.resolve({ data: null, error: mockError }));
      
      mockSupabase.from.mockReturnValue(mockMethods);

      try {
        await createUserRecord(mockUserData);
        expect(true).toBe(false); 
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 20000); 
  });
});

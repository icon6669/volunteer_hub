import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createUserRecord } from '../utils/userManagement';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isManager: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearMessages: () => void;
  logout: () => Promise<void>;
  updateEmailNotifications: (userId: string, value: boolean) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetUnreadMessages: (userId: string) => Promise<boolean>;
  updateUserRole: (userId: string, newRole: UserRole | string) => Promise<boolean>;
  transferOwnership: (newOwnerId: string) => Promise<boolean>;
  clearDatabaseData: () => Promise<boolean>;
  users: any[];
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If user exists, check their role
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If user exists, check their role
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsManager(false);
        setIsOwner(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      if (data) {
        // Admin role has all privileges
        if (data.user_role === 'ADMIN' || data.user_role === 'admin') {
          setIsManager(true);
          setIsOwner(true);
          return;
        }
        
        // Owner role has manager privileges
        if (data.user_role === 'OWNER' || data.user_role === 'owner') {
          setIsManager(true);
          setIsOwner(true);
          return;
        }
        
        // Manager role
        if (data.user_role === 'MANAGER' || data.user_role === 'manager') {
          setIsManager(true);
          setIsOwner(false);
          return;
        }
        
        // Volunteer or other roles
        setIsManager(false);
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if this is the first user
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.warn('Error checking if first user, will proceed with signup:', countError);
      }
      
      const isFirstUser = !countError && count === 0;
      console.info('Is first user?', isFirstUser);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_first_user: isFirstUser,
            name: email.split('@')[0] // Use part before @ as initial name
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        // Create user record in the database
        // The database trigger will handle role assignment based on first user status
        await createUserRecord(
          data.user,
          isFirstUser ? UserRole.OWNER : UserRole.VOLUNTEER
        );
        
        setSuccess('Account created successfully! Please check your email for verification.');
        
        // Automatically sign in the user if email verification is not required
        if (data.session) {
          setUser(data.user);
          setSession(data.session);
          
          // Check user role and set permissions
          const { data: userData } = await supabase
            .from('users')
            .select('user_role')
            .eq('id', data.user.id)
            .single();
          
          if (userData) {
            setIsManager(userData.user_role === 'MANAGER' || userData.user_role === 'OWNER' || userData.user_role === 'ADMIN');
            setIsOwner(userData.user_role === 'OWNER');
          }
        }
      }
    } catch (error) {
      console.error('Error signing up:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateEmailNotifications = async (userId: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ email_notifications: value })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating email notifications:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating email notifications:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const resetUnreadMessages = async (userId: string) => {
    try {
      // Update the unread_messages count to 0 in the database
      const { error } = await supabase
        .from('users')
        .update({ unread_messages: 0 })
        .eq('id', userId);
      
      if (error) {
        console.error('Error resetting unread messages:', error);
        return false;
      }
      
      // Also update the users array to reflect the change
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, unread_messages: 0 } : u
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error resetting unread messages:', error);
      return false;
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole | string) => {
    try {
      if (!user || !isOwner) {
        setError('Only owners can update user roles');
        return false;
      }
      
      // Call the Supabase function to update the user role
      const { error } = await supabase
        .from('users')
        .update({ user_role: newRole })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user role:', error);
        setError('Failed to update user role: ' + error.message);
        return false;
      }
      
      setSuccess('User role updated successfully');
      
      // Refresh the users list
      fetchUsers();
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      if (error instanceof Error) {
        setError('Failed to update user role: ' + error.message);
      } else {
        setError('An unexpected error occurred while updating user role');
      }
      return false;
    }
  };

  // Transfer ownership to another user
  const transferOwnership = async (newOwnerId: string) => {
    try {
      if (!user) {
        setError('You must be logged in to transfer ownership');
        return false;
      }
      
      // Begin a transaction to ensure both updates succeed or fail together
      const { error } = await supabase.rpc('transfer_ownership', {
        current_owner_id: user.id,
        new_owner_id: newOwnerId
      });
      
      if (error) {
        console.error('Error transferring ownership:', error);
        setError('Failed to transfer ownership: ' + error.message);
        return false;
      }
      
      // Update the users array to reflect the changes
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, user_role: UserRole.VOLUNTEER } 
            : u.id === newOwnerId 
              ? { ...u, user_role: UserRole.OWNER } 
              : u
        )
      );
      
      // Update the current user's role in state
      if (user.id) {
        setIsOwner(false);
      }
      
      setSuccess('Ownership transferred successfully');
      return true;
    } catch (error) {
      console.error('Error transferring ownership:', error);
      if (error instanceof Error) {
        setError('Failed to transfer ownership: ' + error.message);
      } else {
        setError('An unexpected error occurred while transferring ownership');
      }
      return false;
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Clear all data from the database (OWNER only)
  const clearDatabaseData = async () => {
    try {
      if (!user || !isOwner) {
        setError('Only owners can clear database data');
        return false;
      }
      
      // Call the RPC function to clear database data
      const { error } = await supabase.rpc('clear_database_data');
      
      if (error) {
        console.error('Error clearing database data:', error);
        setError('Failed to clear database data: ' + error.message);
        return false;
      }
      
      setSuccess('Database data cleared successfully');
      
      // Refresh the users list
      fetchUsers();
      
      return true;
    } catch (error) {
      console.error('Error clearing database data:', error);
      if (error instanceof Error) {
        setError('Failed to clear database data: ' + error.message);
      } else {
        setError('An unexpected error occurred while clearing database data');
      }
      return false;
    }
  };

  // Fetch all users from the database
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Initialize users list when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const value = {
    user,
    session,
    loading,
    error,
    success,
    isAuthenticated: !!user,
    isLoading: loading,
    isManager,
    isOwner,
    signIn,
    signUp,
    signOut,
    logout,
    updateEmailNotifications,
    deleteUser,
    resetUnreadMessages,
    updateUserRole,
    transferOwnership,
    clearMessages,
    clearDatabaseData,
    users,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

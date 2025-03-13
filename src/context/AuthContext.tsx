import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createUserRecord } from '../utils/userManagement';

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
  users: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        if (data.user_role === 'admin') {
          setIsManager(true);
          setIsOwner(true);
          return;
        }
        
        // Owner role has manager privileges
        if (data.user_role === 'owner') {
          setIsManager(true);
          setIsOwner(true);
          return;
        }
        
        // Manager role
        if (data.user_role === 'manager') {
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
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Create user record in users table with default 'volunteer' role
      if (data?.user) {
        try {
          const userCreated = await createUserRecord(data.user);
          if (!userCreated) {
            console.warn('User record may not have been created properly');
            // Continue anyway as the auth user was created
          }
        } catch (userRecordError) {
          console.error('Error creating user record:', userRecordError);
          // Continue anyway as the auth user was created
        }
      }
      
      setSuccess('Account created successfully! Please sign in.');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Signup error:', error);
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

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
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
    clearMessages,
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { UserService } from '../services/UserService';
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  checkOwnerExists: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const userService = new UserService();

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Check current session
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthChange = async (event: string, session: Session | null) => {
    if (event === 'SIGNED_IN') {
      if (session?.user) {
        await updateUserData(session.user);
      }
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await updateUserData(session.user);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setError(error instanceof Error ? error : new Error('Session check failed'));
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (supabaseUser: SupabaseUser) => {
    try {
      const userData = await userService.getUser(supabaseUser.id);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch user data'));
    }
  };

  const checkOwnerExists = async (): Promise<boolean> => {
    try {
      const users = await userService.getUsers();
      return users.some(u => u.userRole === UserRole.OWNER);
    } catch (error) {
      console.error('Error checking for owner:', error);
      setError(error instanceof Error ? error : new Error('Failed to check for owner'));
      return false;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      // Create user in our database
      await userService.createUser({
        name: email.split('@')[0], // Use part before @ as temporary name
        email,
        userRole: UserRole.VOLUNTEER, // Default role
        emailNotifications: true,
        unreadMessages: 0,
        providerId: data.user.id
      });
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error instanceof Error ? error : new Error('Sign up failed'));
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error instanceof Error ? error : new Error('Sign in failed'));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');
      window.location.href = data.url;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error instanceof Error ? error : new Error('Google sign in failed'));
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');
      window.location.href = data.url;
    } catch (error) {
      console.error('Error signing in with Facebook:', error);
      setError(error instanceof Error ? error : new Error('Facebook sign in failed'));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error : new Error('Sign out failed'));
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    checkOwnerExists
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
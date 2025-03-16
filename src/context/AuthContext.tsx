import { createContext, useContext, useState, useEffect } from 'react';
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
  isAdmin: boolean;
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
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  transferOwnership: (newOwnerId: string) => Promise<boolean>;
  clearDatabaseData: () => Promise<boolean>;
  users: any[];
  resetPassword: (email: string) => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
        setIsAdmin(false);
        setIsManager(false);
        setIsOwner(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      // First, check if the user exists
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.info('User record not found, attempting to create one:', userId);
        
        // Get user details from auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Error getting auth user:', authError);
          return;
        }
        
        if (authUser) {
          // Check if this is the first user
          const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
          
          const isFirstUser = !countError && count === 0;
          console.info('Creating new user record. Is first user?', isFirstUser);
          
          try {
            // Create user record and wait for it to be confirmed
            await createUserRecord(
              authUser,
              isFirstUser ? UserRole.OWNER : UserRole.VOLUNTEER
            );
            
            // After successful creation, fetch the user data
            const { data: newUserData, error: newUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (newUserError) {
              console.error('Error fetching new user record:', newUserError);
              setError('Error setting up user account. Please try logging out and back in.');
              return;
            }
            
            userData = newUserData;
            console.info('Successfully created and fetched user data:', userData);
          } catch (createError) {
            console.error('Error creating user record:', createError);
            setError('Error creating user account. Please try logging out and back in.');
            return;
          }
        }
      }
      
      if (userData) {
        console.info('Setting user role from data:', userData);
        
        const role = userData.user_role;
        setIsAdmin(role === 'admin');
        setIsOwner(role === 'owner');
        setIsManager(role === 'manager' || role === 'owner');
      } else {
        console.error('No user data available after creation attempts');
        setError('Unable to set up user account. Please contact support.');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setError('Error checking user permissions. Please try again.');
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else {
          setError(error.message);
        }
        throw error;
      }
      
      // If we get here, sign-in was successful
      if (data?.user) {
        console.info('Sign-in successful for user:', data.user);
        setSuccess('Sign in successful!');
        
        // Check user role and set permissions
        await checkUserRole(data.user.id);
      }
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
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
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Please sign in or reset your password.');
        } else if (error.message.includes('password')) {
          setError('Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.');
        } else {
          setError(error.message);
        }
        throw error;
      }
      
      if (data?.user) {
        console.info('Sign-up successful for user:', data.user);
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
            const role = userData.user_role;
            setIsAdmin(role === 'admin');
            setIsOwner(role === 'owner');
            setIsManager(role === 'manager' || role === 'owner');
          }
        }
      }
    } catch (error) {
      console.error('Error signing up:', error);
      if (error instanceof Error && !error.message.includes('already registered') && !error.message.includes('password')) {
        setError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      setSuccess('Password reset instructions have been sent to your email.');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      if (error instanceof Error && !error.message) {
        setError('An unexpected error occurred while requesting password reset.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        throw error;
      }
      // Clear user state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsManager(false);
      setIsOwner(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    return signOut();
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
      setUsers((prevUsers: any[]) =>
        prevUsers.map((u: any) =>
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
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      if (!user || !isOwner) {
        setError('Only owners can update user roles');
        return false;
      }

      const { error } = await supabase
        .from('users')
        .update({ user_role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        setError('Failed to update user role');
        return false;
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, user_role: newRole } : u
        )
      );

      setSuccess('User role updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('An unexpected error occurred');
      return false;
    }
  };

  // Transfer ownership to another user
  const transferOwnership = async (newOwnerId: string) => {
    try {
      if (!user || !isOwner) {
        setError('Only the current owner can transfer ownership');
        return false;
      }

      // Update the new owner's role to OWNER
      const { error: updateError } = await supabase
        .from('users')
        .update({ user_role: UserRole.OWNER })
        .eq('id', newOwnerId);

      if (updateError) {
        console.error('Error updating new owner role:', updateError);
        setError('Failed to transfer ownership');
        return false;
      }

      // Update the current owner's role to VOLUNTEER
      const { error: currentOwnerError } = await supabase
        .from('users')
        .update({ user_role: UserRole.VOLUNTEER })
        .eq('id', user.id);

      if (currentOwnerError) {
        console.error('Error updating current owner role:', currentOwnerError);
        setError('Failed to transfer ownership');
        return false;
      }

      // Update local state
      setUsers((prevUsers: any[]) =>
        prevUsers.map((u: any) =>
          u.id === user.id 
            ? { ...u, user_role: UserRole.VOLUNTEER } 
            : u.id === newOwnerId 
              ? { ...u, user_role: UserRole.OWNER } 
              : u
        )
      );

      setIsOwner(false);
      setIsManager(true);
      setSuccess('Ownership transferred successfully');
      return true;
    } catch (error) {
      console.error('Error transferring ownership:', error);
      setError('An unexpected error occurred');
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
    isAdmin,
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
    resetPassword,
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

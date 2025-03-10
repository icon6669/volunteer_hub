import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import * as api from '../api';



interface LoginResponse {
  user: User | null;
  error: Error | null | unknown;
}

// API response types are defined in the API module

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isManager: boolean;
  needsOwner: boolean;
  loginWithEmail: (email: string, password: string) => Promise<LoginResponse>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  transferOwnership: (newOwnerId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateEmailNotifications: (userId: string, enabled: boolean) => Promise<void>;
  incrementUnreadMessages: (userId: string) => Promise<void>;
  resetUnreadMessages: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOwner, setNeedsOwner] = useState(false);

  const isOwner = user?.userRole === UserRole.OWNER;
  const isManager = user?.userRole === UserRole.MANAGER || isOwner;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        
        // Temporary check to debug database policies
        try {
          console.log('Checking database policies...');
          // Use dynamic access to avoid TypeScript errors
          const checkFunc = (api as any).checkDatabasePolicies;
          if (typeof checkFunc === 'function') {
            const policyCheck = await checkFunc();
            console.log('Policy check results:', policyCheck);
          }
        } catch (err) {
          console.error('Policy check error:', err);
        }
        
        // Call the API and handle the response
        const response = await api.fetchUsers();
        
        // Safely handle the response structure
        let fetchedUsers: User[] = [];
        let ownerNeeded = false;
        
        if (response && typeof response === 'object' && 'users' in response && 'needsOwner' in response) {
          // Explicitly check and assert the types
          if (Array.isArray(response.users)) {
            fetchedUsers = response.users as User[];
          }
          if (typeof response.needsOwner === 'boolean') {
            ownerNeeded = response.needsOwner;
          }
        } else {
          console.error('Unexpected response format from fetchUsers:', response);
        }
        
        // Now we can use the destructured values directly
        setUsers(fetchedUsers);
        setNeedsOwner(ownerNeeded);
        
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const currentUser = fetchedUsers.find((u: User) => u.id === parsedUser.id);
          if (currentUser) {
            setUser(currentUser);
          } else {
            sessionStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Error loading users:', error instanceof Error ? error.message : 'Unknown error');
        setUsers([]);
        setNeedsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (userData) {
        setUser(userData);
        return { user: userData, error: null };
      }

      return { user: null, error: new Error('User not found') };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error instanceof Error ? error : new Error('Login failed') };
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Mock Google login");
      
      const email = "google.user@example.com";
      const name = "Google User";
      
      const existingUser = users.find((u: User) => u.email === email);
      
      if (existingUser) {
        setUser(existingUser);
        sessionStorage.setItem('currentUser', JSON.stringify(existingUser));
      } else {
        const newUser: User = {
          id: supabase.auth.user()?.id,
          name,
          email,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          userRole: needsOwner ? UserRole.OWNER : UserRole.VOLUNTEER,
          emailNotifications: true,
          unreadMessages: 0,
          providerId: 'google.com'
        };
        
        const response = await api.saveUser(newUser);
        
        if (response) {
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(newUser);
          setNeedsOwner(false); 
          sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        }
      }
    } catch (error) {
      console.error("Error during Google login:", error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFacebook = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Mock Facebook login");
      
      const email = "facebook.user@example.com";
      const name = "Facebook User";
      
      const existingUser = users.find((u: User) => u.email === email);
      
      if (existingUser) {
        setUser(existingUser);
        sessionStorage.setItem('currentUser', JSON.stringify(existingUser));
      } else {
        const newUser: User = {
          id: supabase.auth.user()?.id,
          name,
          email,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          userRole: needsOwner ? UserRole.OWNER : UserRole.VOLUNTEER,
          emailNotifications: true,
          unreadMessages: 0,
          providerId: 'facebook.com'
        };
        
        const response = await api.saveUser(newUser);
        
        if (response) {
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(newUser);
          setNeedsOwner(false); 
          sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        }
      }
    } catch (error) {
      console.error("Error during Facebook login:", error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      sessionStorage.removeItem('currentUser');
    } catch (error) {
      console.error("Error during logout:", error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
      console.log(`Mock password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    try {
      const success = await api.updateUserRole(userId, role);
      
      if (success) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, userRole: role } : u
        );
        
        setUsers(updatedUsers);
        
        if (user && user.id === userId) {
          const updatedUser = { ...user, userRole: role };
          setUser(updatedUser);
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const transferOwnership = async (newOwnerId: string): Promise<void> => {
    if (!isOwner || !user) return;
    
    try {
      const newOwnerUser = users.find(u => u.id === newOwnerId);
      if (!newOwnerUser) {
        console.error('User not found for ownership transfer');
        return;
      }
      
      await api.updateUserRole(newOwnerId, UserRole.OWNER);
      
      await api.updateUserRole(user.id, UserRole.MANAGER);
      
      const updatedUsers = users.map(u => {
        if (u.id === newOwnerId) return { ...u, userRole: UserRole.OWNER };
        if (u.id === user.id) return { ...u, userRole: UserRole.MANAGER };
        return u;
      });
      
      setUsers(updatedUsers);
      
      const updatedCurrentUser = { ...user, userRole: UserRole.MANAGER };
      setUser(updatedCurrentUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    } catch (error) {
      console.error('Error transferring ownership:', error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  const deleteUser = async (userId: string): Promise<void> => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        console.error('User not found for deletion');
        return;
      }
      
      if (userToDelete.userRole === UserRole.OWNER) {
        console.error('Cannot delete the owner account');
        return;
      }
      
      const success = await api.deleteUser(userId);
      
      if (success) {
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        
        if (user && user.id === userId) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const updateEmailNotifications = async (userId: string, enabled: boolean): Promise<void> => {
    try {
      const success = await api.updateEmailNotifications(userId, enabled);
      
      if (success) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, emailNotifications: enabled } : u
        );
        
        setUsers(updatedUsers);
        
        if (user && user.id === userId) {
          const updatedUser = { ...user, emailNotifications: enabled };
          setUser(updatedUser);
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error updating email notifications:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const incrementUnreadMessages = async (userId: string): Promise<void> => {
    try {
      const success = await api.incrementUnreadMessages(userId);
      
      if (success) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, unreadMessages: (u.unreadMessages || 0) + 1 } : u
        );
        
        setUsers(updatedUsers);
        
        if (user && user.id === userId) {
          const updatedUser = { ...user, unreadMessages: (user.unreadMessages || 0) + 1 };
          setUser(updatedUser);
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error incrementing unread messages:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const resetUnreadMessages = async (userId: string): Promise<void> => {
    try {
      const success = await api.resetUnreadMessages(userId);
      
      if (success) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, unreadMessages: 0 } : u
        );
        
        setUsers(updatedUsers);
        
        if (user && user.id === userId) {
          const updatedUser = { ...user, unreadMessages: 0 };
          setUser(updatedUser);
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error resetting unread messages:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const contextValue: AuthContextType = {
    user,
    users,
    isAuthenticated: !!user,
    isLoading,
    isOwner,
    isManager,
    needsOwner,
    loginWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    sendPasswordResetEmail,
    updateUserRole,
    transferOwnership,
    deleteUser,
    updateEmailNotifications,
    incrementUnreadMessages,
    resetUnreadMessages
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../types';
import * as api from '../api';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isManager: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const isOwner = user?.userRole === UserRole.OWNER;
  const isManager = user?.userRole === UserRole.MANAGER || isOwner;

  // Load users from server
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const fetchedUsers = await api.fetchUsers();
        setUsers(fetchedUsers);
        
        // Check if there's a current user in sessionStorage (for session persistence)
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Find the user in the fetched users to ensure we have the latest data
          const currentUser = fetchedUsers.find(u => u.id === parsedUser.id);
          if (currentUser) {
            setUser(currentUser);
          } else {
            // If user no longer exists on server, remove from sessionStorage
            sessionStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Error loading users:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check if user exists in our system
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        // Update user in state and sessionStorage for session persistence
        setUser(existingUser);
        sessionStorage.setItem('currentUser', JSON.stringify(existingUser));
      } else {
        // Create new user if they don't exist
        const newUser: User = {
          id: uuidv4(),
          name: email.split('@')[0],
          email,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
          userRole: users.length === 0 ? UserRole.OWNER : UserRole.VOLUNTEER,
          emailNotifications: true,
          unreadMessages: 0,
          providerId: 'password'
        };
        
        // Save new user to server
        const savedUser = await api.saveUser(newUser);
        
        if (savedUser) {
          // Update local state
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(newUser);
          
          // Store current user in sessionStorage for session persistence
          sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        }
      }
    } catch (error) {
      console.error("Error during email login:", error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // This is a mock implementation since we're not using real Firebase
      console.log("Mock Google login");
      
      // Create a mock user
      const email = "google.user@example.com";
      const name = "Google User";
      
      // Check if user exists in our system
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        setUser(existingUser);
        sessionStorage.setItem('currentUser', JSON.stringify(existingUser));
      } else {
        // Create new user
        const newUser: User = {
          id: uuidv4(),
          name,
          email,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          userRole: users.length === 0 ? UserRole.OWNER : UserRole.VOLUNTEER,
          emailNotifications: true,
          unreadMessages: 0,
          providerId: 'google.com'
        };
        
        // Save new user to server
        const savedUser = await api.saveUser(newUser);
        
        if (savedUser) {
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(newUser);
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

  const loginWithFacebook = async () => {
    setIsLoading(true);
    try {
      // This is a mock implementation since we're not using real Firebase
      console.log("Mock Facebook login");
      
      // Create a mock user
      const email = "facebook.user@example.com";
      const name = "Facebook User";
      
      // Check if user exists in our system
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        setUser(existingUser);
        sessionStorage.setItem('currentUser', JSON.stringify(existingUser));
      } else {
        // Create new user
        const newUser: User = {
          id: uuidv4(),
          name,
          email,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          userRole: users.length === 0 ? UserRole.OWNER : UserRole.VOLUNTEER,
          emailNotifications: true,
          unreadMessages: 0,
          providerId: 'facebook.com'
        };
        
        // Save new user to server
        const savedUser = await api.saveUser(newUser);
        
        if (savedUser) {
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(newUser);
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

  const logout = async () => {
    try {
      setUser(null);
      sessionStorage.removeItem('currentUser');
    } catch (error) {
      console.error("Error during logout:", error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
      // Mock implementation since we're not using real Firebase
      console.log(`Mock password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      // Update user role on server
      const success = await api.updateUserRole(userId, role);
      
      if (success) {
        // Update local state
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, userRole: role } : u
        );
        
        setUsers(updatedUsers);
        
        // If the updated user is the current user, update the current user state
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

  const transferOwnership = async (newOwnerId: string) => {
    // Only the current owner can transfer ownership
    if (!isOwner || !user) return;
    
    try {
      // Find the new owner user
      const newOwnerUser = users.find(u => u.id === newOwnerId);
      if (!newOwnerUser) {
        console.error('User not found for ownership transfer');
        return;
      }
      
      // Update the new owner's role
      await api.updateUserRole(newOwnerId, UserRole.OWNER);
      
      // Update the current owner's role to manager
      await api.updateUserRole(user.id, UserRole.MANAGER);
      
      // Update all users in local state
      const updatedUsers = users.map(u => {
        if (u.id === newOwnerId) return { ...u, userRole: UserRole.OWNER };
        if (u.id === user.id) return { ...u, userRole: UserRole.MANAGER };
        return u;
      });
      
      // Update state
      setUsers(updatedUsers);
      
      // Update current user
      const updatedCurrentUser = { ...user, userRole: UserRole.MANAGER };
      setUser(updatedCurrentUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    } catch (error) {
      console.error('Error transferring ownership:', error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      // Check if user is the owner
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        console.error('User not found for deletion');
        return;
      }
      
      // Cannot delete the owner
      if (userToDelete.userRole === UserRole.OWNER) {
        console.error('Cannot delete the owner account');
        return;
      }
      
      // Delete user from server
      const success = await api.deleteUser(userId);
      
      if (success) {
        // Remove user from users array in local state
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        
        // If deleting the current user, log them out
        if (user && user.id === userId) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const updateEmailNotifications = async (userId: string, enabled: boolean) => {
    try {
      // Update email notifications on server
      const success = await api.updateEmailNotifications(userId, enabled);
      
      if (success) {
        // Update local state
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, emailNotifications: enabled } : u
        );
        
        setUsers(updatedUsers);
        
        // If the updated user is the current user, update the current user state
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

  const incrementUnreadMessages = async (userId: string) => {
    try {
      // Increment unread messages on server
      const success = await api.incrementUnreadMessages(userId);
      
      if (success) {
        // Update local state
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, unreadMessages: (u.unreadMessages || 0) + 1 } : u
        );
        
        setUsers(updatedUsers);
        
        // If the updated user is the current user, update the current user state
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

  const resetUnreadMessages = async (userId: string) => {
    try {
      // Reset unread messages on server
      const success = await api.resetUnreadMessages(userId);
      
      if (success) {
        // Update local state
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, unreadMessages: 0 } : u
        );
        
        setUsers(updatedUsers);
        
        // If the updated user is the current user, update the current user state
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

  return (
    <AuthContext.Provider value={{
      user,
      users,
      isAuthenticated: !!user,
      isLoading,
      isOwner,
      isManager,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};
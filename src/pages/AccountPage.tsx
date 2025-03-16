import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Shield, 
  LogOut, 
  AlertCircle, 
  UserMinus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Database } from '../types/supabase';
import { supabase } from '../lib/supabase';

// Use the database types directly
type DbUser = Database['public']['Tables']['users']['Row'];

// Extended user interface for UI components with proper typing
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  user_role: UserRole;
  emailNotifications: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
}

const AccountPage: React.FC = () => {
  const { 
    user: authUser, 
    isAuthenticated, 
    logout, 
    updateEmailNotifications,
    deleteUser,
    clearMessages
  } = useAuth();
  
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  
  // Clear any authentication messages when component mounts
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);
  
  // Fetch user data from the users table
  useEffect(() => {
    if (authUser) {
      const fetchUserData = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }
        
        if (data) {
          // Convert database user to ExtendedUser with proper type handling
          const dbUser = data as DbUser;
          
          const extendedUser: ExtendedUser = {
            id: authUser.id,
            // Ensure email is always a string as required by the database schema
            email: authUser.email || '',
            // Use name from database or fallback to email username or 'User'
            name: dbUser.name || (authUser.email?.split('@')[0] || 'User'),
            // Ensure user_role is properly typed
            user_role: dbUser.user_role as UserRole,
            emailNotifications: Boolean(dbUser.email_notifications),
            image: dbUser.image,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at
          };
          
          setUser(extendedUser);
          setEmailNotifications(Boolean(dbUser.email_notifications));
        }
      };
      
      fetchUserData();
    }
  }, [authUser]);
  
  // Redirect if not authenticated
  if (!isAuthenticated || !authUser) {
    return <Navigate to="/login" />;
  }
  
  // Show loading state while fetching user data
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user data...</p>
      </div>
    );
  }
  
  const handleEmailNotificationsChange = async () => {
    const newValue = !emailNotifications;
    const success = await updateEmailNotifications(user.id, newValue);
    if (success) {
      setEmailNotifications(newValue);
    }
  };
  
  const handleDeleteAccount = () => {
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteAccount = async () => {
    if (deleteConfirmText === 'DELETE ACCOUNT') {
      await deleteUser(user.id);
      // User will be logged out automatically after deletion
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mr-4">
            <span className="text-primary-800 font-bold text-2xl">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-1">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                user.user_role === UserRole.OWNER 
                  ? 'bg-primary-100 text-primary-800' 
                  : user.user_role === UserRole.MANAGER 
                    ? 'bg-secondary-100 text-secondary-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {user.user_role ? user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1) : 'Volunteer'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Account Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Authentication Provider</p>
              <p>Email/Password</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Account Type</p>
              <p>{user.user_role ? user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1) : 'Volunteer'}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Member Since</p>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={emailNotifications}
                onChange={handleEmailNotificationsChange}
              />
              <div className={`block w-14 h-8 rounded-full ${emailNotifications ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${emailNotifications ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3">
              <span className="font-medium">Email Notifications</span>
              <p className="text-gray-500 text-sm">Receive email updates about events and volunteer opportunities</p>
            </div>
          </label>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
        
        {user.user_role === UserRole.OWNER && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary-600" />
              Organization Settings
            </h3>
            <p className="text-gray-600 mb-3">Manage your organization's settings and preferences</p>
            <Link 
              to="/settings" 
              className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Organization Settings
            </Link>
          </div>
        )}
        
        {(user.user_role === UserRole.OWNER || user.user_role === UserRole.MANAGER) && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-secondary-600" />
              User Management
            </h3>
            <p className="text-gray-600 mb-3">Manage users and their roles within your organization</p>
            <Link 
              to="/users" 
              className="inline-block bg-secondary-600 text-white px-4 py-2 rounded-md hover:bg-secondary-700 transition-colors"
            >
              Manage Users
            </Link>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <LogOut className="h-5 w-5 mr-2 text-gray-600" />
            Sign Out
          </h3>
          <p className="text-gray-600 mb-3">Sign out of your account</p>
          <button 
            onClick={logout}
            className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2 flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Delete Account
          </h3>
          <p className="text-gray-600 mb-3">Permanently delete your account and all associated data</p>
          
          {!showDeleteConfirm ? (
            <button 
              onClick={handleDeleteAccount}
              className="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start mb-3">
                <UserMinus className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-600">Confirm Account Deletion</h4>
                  <p className="text-sm text-gray-600">This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type DELETE ACCOUNT to confirm
                </label>
                <input 
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="DELETE ACCOUNT"
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={confirmDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE ACCOUNT'}
                  className={`px-4 py-2 rounded-md ${
                    deleteConfirmText === 'DELETE ACCOUNT' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  Confirm Deletion
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  LogOut, 
  AlertCircle, 
  UserMinus,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const AccountPage: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    logout, 
    updateEmailNotifications,
    deleteUser
  } = useAuth();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications || false);
  
  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }
  
  const handleEmailNotificationsChange = async () => {
    const newValue = !emailNotifications;
    await updateEmailNotifications(user.id, newValue);
    setEmailNotifications(newValue);
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
  
  const getProviderIcon = (providerId?: string) => {
    if (!providerId || providerId === 'password') {
      return <Mail className="h-5 w-5 text-gray-500" />;
    }
    
    if (providerId.includes('google')) {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      );
    } else if (providerId.includes('facebook')) {
      return (
        <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
          <path
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      );
    }
    
    return <Mail className="h-5 w-5 text-gray-500" />;
  };
  
  const getProviderName = (providerId?: string) => {
    if (!providerId || providerId === 'password') return 'Email';
    if (providerId.includes('google')) return 'Google';
    if (providerId.includes('facebook')) return 'Facebook';
    return 'Email';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <User className="mr-2 h-6 w-6 text-primary-600" />
          My Account
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-lg">Profile Information</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center mb-6">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name} 
                  className="h-20 w-20 rounded-full mr-4"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <span className="text-primary-800 font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-1">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    user.userRole === UserRole.OWNER 
                      ? 'bg-primary-100 text-primary-800' 
                      : user.userRole === UserRole.MANAGER 
                        ? 'bg-secondary-100 text-secondary-800' 
                        : 'bg-accent-100 text-accent-800'
                  }`}>
                    {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center text-gray-600 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {getProviderIcon(user.providerId)}
                </div>
                <div>
                  <p className="text-sm font-medium">Sign in method</p>
                  <p className="text-sm">{getProviderName(user.providerId)}</p>
                </div>
              </div>
              
              {user.userRole === UserRole.OWNER && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800 flex items-start">
                    <Shield className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>
                      As the system owner, you must transfer ownership before deleting your account.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-lg">Notification Settings</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-gray-500">Receive email notifications for messages and updates</p>
                </div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={emailNotifications}
                  onChange={handleEmailNotificationsChange}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="emailNotifications"
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                    emailNotifications ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                ></label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Account Actions Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-lg">Account Actions</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
              
              {user.userRole !== UserRole.OWNER && (
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors"
                >
                  <UserMinus className="h-5 w-5 mr-2" />
                  Delete Account
                </button>
              )}
              
              {user.userRole === UserRole.OWNER && (
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-center px-4 py-2 border border-primary-300 rounded-md text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Manage Users
                </Link>
              )}
            </div>
            
            {user.userRole === UserRole.OWNER && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  To delete your account, you must first transfer ownership to another user from the Admin page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4 text-red-600">
                <AlertCircle className="h-6 w-6 mr-2" />
                <h2 className="text-xl font-semibold">Delete Your Account</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  You are about to permanently delete your account. This action will:
                </p>
                
                <ul className="list-disc pl-5 mb-4 text-gray-600 space-y-1">
                  <li>Remove all your personal data from the system</li>
                  <li>Log you out immediately</li>
                  <li>Prevent you from accessing your account again</li>
                </ul>
                
                <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
                  <AlertCircle className="h-4 w-4 inline-block mr-1" />
                  To confirm, please type <strong>DELETE ACCOUNT</strong> in the field below.
                </div>
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE ACCOUNT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE ACCOUNT'}
                  className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
                    deleteConfirmText !== 'DELETE ACCOUNT' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
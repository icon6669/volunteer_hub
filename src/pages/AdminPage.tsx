import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, UserCheck, UserX, Mail, LogIn, UserMinus, AlertCircle } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { users, updateUserRole, user, transferOwnership, deleteUser } = useAuth();
  
  // State for ownership transfer confirmation
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferUserId, setTransferUserId] = useState<string | null>(null);
  const [transferConfirmText, setTransferConfirmText] = useState('');
  
  // State for user deletion confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const getProviderIcon = (providerId?: string) => {
    if (!providerId) return <Mail className="h-4 w-4 text-gray-500" />;
    
    if (providerId.includes('google')) {
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
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
        <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
          <path
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      );
    }
    
    return <Mail className="h-4 w-4 text-gray-500" />;
  };
  
  const getProviderName = (providerId?: string) => {
    if (!providerId) return 'Email';
    if (providerId.includes('google')) return 'Google';
    if (providerId.includes('facebook')) return 'Facebook';
    return 'Email';
  };
  
  const handleTransferOwnership = (userId: string) => {
    setTransferUserId(userId);
    setTransferConfirmText('');
    setShowTransferConfirm(true);
  };
  
  const confirmTransferOwnership = () => {
    if (transferUserId && transferConfirmText === 'TRANSFER OWNERSHIP') {
      transferOwnership(transferUserId);
      setShowTransferConfirm(false);
      setTransferUserId(null);
      setTransferConfirmText('');
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteUser = () => {
    if (deleteUserId && deleteConfirmText === 'DELETE ACCOUNT') {
      deleteUser(deleteUserId);
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
      setDeleteConfirmText('');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="mr-2 h-6 w-6 text-primary-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage user roles and system settings
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {u.image ? (
                            <img className="h-10 w-10 rounded-full" src={u.image} alt={u.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-800 font-medium">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {u.name}
                            {u.id === user?.id && (
                              <span className="ml-2 text-xs text-gray-500">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        {getProviderIcon(u.providerId)}
                        <span className="ml-1">{getProviderName(u.providerId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${u.userRole === UserRole.OWNER 
                          ? 'bg-primary-100 text-primary-800' 
                          : u.userRole === UserRole.MANAGER 
                            ? 'bg-secondary-100 text-secondary-800' 
                            : 'bg-accent-100 text-accent-800'}`}>
                        {u.userRole.charAt(0).toUpperCase() + u.userRole.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {/* Role management actions */}
                        {u.id !== user?.id ? (
                          <>
                            {u.userRole !== UserRole.MANAGER && (
                              <button
                                onClick={() => updateUserRole(u.id, UserRole.MANAGER)}
                                className="text-secondary-600 hover:text-secondary-900 flex items-center"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Make Manager
                              </button>
                            )}
                            {u.userRole !== UserRole.VOLUNTEER && (
                              <button
                                onClick={() => updateUserRole(u.id, UserRole.VOLUNTEER)}
                                className="text-gray-600 hover:text-gray-900 flex items-center"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Remove Manager
                              </button>
                            )}
                            
                            {/* Transfer ownership button (only for non-owner users) */}
                            {user?.userRole === UserRole.OWNER && u.userRole !== UserRole.OWNER && (
                              <button
                                onClick={() => handleTransferOwnership(u.id)}
                                className="text-primary-600 hover:text-primary-900 flex items-center"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Make Owner
                              </button>
                            )}
                            
                            {/* Delete user button */}
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400">
                            {u.userRole === UserRole.OWNER 
                              ? "Transfer ownership to delete account" 
                              : "Cannot modify own role"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No users registered yet
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Role Permissions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-primary-700">Owner</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Full system access
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Manage user roles
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Create and manage events
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Volunteer for events
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Transfer ownership
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Delete user accounts
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-secondary-700">Manager</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Manage user roles
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Create and manage events
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Create and manage roles
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Volunteer for events
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Transfer ownership
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Delete user accounts
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-accent-700">Volunteer</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Manage user roles
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Create and manage events
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Create and manage roles
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Volunteer for events
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Transfer ownership
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Delete user accounts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transfer Ownership Confirmation Modal */}
      {showTransferConfirm && transferUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4 text-primary-600">
                <Shield className="h-6 w-6 mr-2" />
                <h2 className="text-xl font-semibold">Transfer Ownership</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  You are about to transfer ownership to <strong>{users.find(u => u.id === transferUserId)?.name}</strong>. 
                  This action will:
                </p>
                
                <ul className="list-disc pl-5 mb-4 text-gray-600 space-y-1">
                  <li>Make them the new system owner with full access</li>
                  <li>Demote you to a manager role</li>
                  <li>This action cannot be undone</li>
                </ul>
                
                <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm mb-4">
                  <AlertCircle className="h-4 w-4 inline-block mr-1" />
                  To confirm, please type <strong>TRANSFER OWNERSHIP</strong> in the field below.
                </div>
                
                <input
                  type="text"
                  value={transferConfirmText}
                  onChange={(e) => setTransferConfirmText(e.target.value)}
                  placeholder="Type TRANSFER OWNERSHIP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTransferConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransferOwnership}
                  disabled={transferConfirmText !== 'TRANSFER OWNERSHIP'}
                  className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors ${
                    transferConfirmText !== 'TRANSFER OWNERSHIP' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Transfer Ownership
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && deleteUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4 text-red-600">
                <AlertCircle className="h-6 w-6 mr-2" />
                <h2 className="text-xl font-semibold">Delete User Account</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  You are about to permanently delete the account for <strong>{users.find(u => u.id === deleteUserId)?.name}</strong>. 
                  This action will:
                </p>
                
                <ul className="list-disc pl-5 mb-4 text-gray-600 space-y-1">
                  <li>Remove all user data from the system</li>
                  <li>Prevent this user from logging in again</li>
                  <li>This action cannot be undone</li>
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
                  onClick={confirmDeleteUser}
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

export default AdminPage;
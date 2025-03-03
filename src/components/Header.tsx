import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Home, LogOut, User as UserIcon, Shield, Inbox, Bell, BarChart, Settings, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMessageContext } from '../context/MessageContext';
import { UserRole } from '../types';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, isOwner, isManager } = useAuth();
  const { getUnreadCount } = useMessageContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const unreadCount = user ? getUnreadCount(user.id) : 0;
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  const closeUserMenu = () => {
    setShowUserMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    closeUserMenu();
  };
  
  return (
    <header className="bg-primary-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Users className="h-8 w-8" />
            <span className="text-xl font-bold">Volunteer Hub</span>
          </Link>
          
          <div className="flex items-center">
            <nav className="flex space-x-6 mr-6">
              <Link 
                to="/" 
                className={`flex items-center space-x-1 hover:text-primary-200 transition-colors ${
                  location.pathname === '/' ? 'text-white font-semibold' : 'text-primary-100'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link 
                to="/events" 
                className={`flex items-center space-x-1 hover:text-primary-200 transition-colors ${
                  location.pathname.includes('/events') ? 'text-white font-semibold' : 'text-primary-100'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Events</span>
              </Link>
              {isAuthenticated && isManager && (
                <Link 
                  to="/dashboard" 
                  className={`flex items-center space-x-1 hover:text-primary-200 transition-colors ${
                    location.pathname.includes('/dashboard') ? 'text-white font-semibold' : 'text-primary-100'
                  }`}
                >
                  <BarChart className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              )}
              {isAuthenticated && (
                <Link 
                  to="/inbox" 
                  className={`flex items-center space-x-1 hover:text-primary-200 transition-colors ${
                    location.pathname.includes('/inbox') ? 'text-white font-semibold' : 'text-primary-100'
                  }`}
                >
                  <div className="relative">
                    <Inbox className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Inbox</span>
                </Link>
              )}
              {isOwner && (
                <Link 
                  to="/admin" 
                  className={`flex items-center space-x-1 hover:text-primary-200 transition-colors ${
                    location.pathname.includes('/admin') ? 'text-white font-semibold' : 'text-primary-100'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 bg-primary-700 hover:bg-primary-600 rounded-full px-3 py-1.5 transition-colors"
                >
                  {user?.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                </button>
                
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={closeUserMenu}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-gray-500 truncate">{user?.email}</div>
                        {user?.userRole && (
                          <div className="mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                            {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
                          </div>
                        )}
                      </div>
                      <Link
                        to="/account"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        My Account
                      </Link>
                      <Link
                        to="/inbox"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <div className="relative">
                          <Inbox className="h-4 w-4 mr-2" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center"></span>
                          )}
                        </div>
                        Messages
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-accent-100 text-accent-800 text-xs rounded-full px-2">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      {isOwner && (
                        <>
                          <Link
                            to="/settings"
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            System Settings
                          </Link>
                          <Link
                            to="/supabase-setup"
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Supabase Setup
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-primary-800 hover:bg-primary-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Trash2, Mail, Clock, Plus, AlertCircle } from 'lucide-react';
import { useMessageContext } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';

const InboxPage: React.FC = () => {
  const { user, users, resetUnreadMessages, updateEmailNotifications } = useAuth();
  const { getUserMessages, markAsRead, deleteMessage } = useMessageContext();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications || false);
  
  useEffect(() => {
    if (user) {
      const userMessages = getUserMessages(user.id);
      setMessages(userMessages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      
      // Reset unread count when visiting inbox
      resetUnreadMessages(user.id);
      
      // Set email notifications state from user
      setEmailNotifications(user.emailNotifications);
    }
  }, [user, getUserMessages, resetUnreadMessages]);
  
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
      // Update local state to reflect the message as read
      setMessages(prev => 
        prev.map(m => m.id === message.id ? { ...m, read: true } : m)
      );
    }
  };
  
  const handleDeleteMessage = () => {
    if (selectedMessage) {
      deleteMessage(selectedMessage.id);
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      setSelectedMessage(null);
      setShowDeleteConfirm(false);
    }
  };
  
  const getSenderName = (senderId: string) => {
    const sender = users.find(u => u.id === senderId);
    return sender ? sender.name : 'Unknown User';
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const toggleEmailNotifications = () => {
    if (user) {
      const newValue = !emailNotifications;
      updateEmailNotifications(user.id, newValue);
      setEmailNotifications(newValue);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Inbox className="mr-2 h-6 w-6 text-primary-600" />
          Inbox
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your messages and communications
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Messages</h2>
                {user?.userRole !== 'volunteer' && (
                  <Link
                    to="/compose"
                    className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Compose
                  </Link>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {messages.length > 0 ? (
                messages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-primary-50' : ''
                    } ${!message.read ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 mt-1 ${!message.read ? 'text-primary-600' : 'text-gray-400'}`}>
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm truncate">
                            {getSenderName(message.senderId)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {message.subject}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No messages in your inbox
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Settings</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <label htmlFor="email-notifications" className="text-sm text-gray-700">
                  Email notifications
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={emailNotifications}
                    onChange={toggleEmailNotifications}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label
                    htmlFor="email-notifications"
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                      emailNotifications ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  ></label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Receive email notifications when you get new messages
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[500px]">
            {selectedMessage ? (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{selectedMessage.subject}</h2>
                    <div className="text-sm text-gray-600">
                      From: {getSenderName(selectedMessage.senderId)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(selectedMessage.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <div className="prose max-w-none">
                    {selectedMessage.content.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
                <Mail className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Select a message to read</p>
                <p className="text-sm">
                  {messages.length > 0 
                    ? 'Click on a message from the list to view its contents' 
                    : 'Your inbox is empty'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4 text-red-500">
                <AlertCircle className="h-6 w-6 mr-2" />
                <h2 className="text-xl font-semibold">Delete Message</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMessage}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
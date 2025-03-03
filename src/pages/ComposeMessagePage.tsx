import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send, ArrowLeft, Users, User, Calendar, Tag } from 'lucide-react';
import { useMessageContext } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { MessageRecipientType } from '../types';

const ComposeMessagePage: React.FC = () => {
  const navigate = useNavigate();
  const { sendMessage } = useMessageContext();
  const { users, user, isManager } = useAuth();
  const { events } = useAppContext();
  
  const [recipientType, setRecipientType] = useState<MessageRecipientType>(MessageRecipientType.INDIVIDUAL);
  const [recipientId, setRecipientId] = useState('');
  const [eventId, setEventId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter out current user from recipients
  const potentialRecipients = users.filter(u => u.id !== user?.id);
  
  useEffect(() => {
    // Reset role selection when event changes
    setRoleId('');
    
    if (eventId) {
      const selectedEvent = events.find(e => e.id === eventId);
      if (selectedEvent) {
        setRoles(selectedEvent.roles.map(r => ({ id: r.id, name: r.name })));
      } else {
        setRoles([]);
      }
    } else {
      setRoles([]);
    }
  }, [eventId, events]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    sendMessage({
      recipientType,
      recipientId: recipientType === MessageRecipientType.INDIVIDUAL ? recipientId : undefined,
      eventId: [MessageRecipientType.EVENT, MessageRecipientType.ROLE].includes(recipientType) ? eventId : undefined,
      roleId: recipientType === MessageRecipientType.ROLE ? roleId : undefined,
      subject,
      content
    });
    
    // Navigate back to inbox after sending
    setTimeout(() => {
      navigate('/inbox');
    }, 500);
  };
  
  if (!isManager) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">Only managers and owners can send messages.</p>
          <Link
            to="/inbox"
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Inbox
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/inbox" className="text-primary-600 hover:text-primary-800 mb-4 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Inbox
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
          <Send className="mr-2 h-6 w-6 text-primary-600" />
          Compose Message
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setRecipientType(MessageRecipientType.INDIVIDUAL)}
                  className={`flex items-center justify-center p-3 rounded-md border ${
                    recipientType === MessageRecipientType.INDIVIDUAL
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType(MessageRecipientType.EVENT)}
                  className={`flex items-center justify-center p-3 rounded-md border ${
                    recipientType === MessageRecipientType.EVENT
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Event
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType(MessageRecipientType.ROLE)}
                  className={`flex items-center justify-center p-3 rounded-md border ${
                    recipientType === MessageRecipientType.ROLE
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Tag className="h-5 w-5 mr-2" />
                  Role
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType(MessageRecipientType.ALL)}
                  className={`flex items-center justify-center p-3 rounded-md border ${
                    recipientType === MessageRecipientType.ALL
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  All Users
                </button>
              </div>
            </div>
            
            {recipientType === MessageRecipientType.INDIVIDUAL && (
              <div className="mb-6">
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient
                </label>
                <select
                  id="recipient"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a recipient</option>
                  {potentialRecipients.map(recipient => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name} ({recipient.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {[MessageRecipientType.EVENT, MessageRecipientType.ROLE].includes(recipientType) && (
              <div className="mb-6">
                <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
                  Event
                </label>
                <select
                  id="event"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({new Date(event.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {recipientType === MessageRecipientType.ROLE && eventId && (
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={8}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Link
                to="/inbox"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComposeMessagePage;
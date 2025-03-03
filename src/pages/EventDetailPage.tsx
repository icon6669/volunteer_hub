import React, { useState } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Edit, Trash2, Plus, AlertCircle, LogIn, Link2, Copy, ExternalLink, Pencil } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import VolunteerForm from '../components/VolunteerForm';

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, deleteEvent, addRole, updateRole } = useAppContext();
  const { isAuthenticated, isManager } = useAuth();
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleCapacity, setNewRoleCapacity] = useState(1);
  const [newRoleMaxCapacity, setNewRoleMaxCapacity, ] = useState<number | undefined>(undefined);
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [useMaxCapacity, setUseMaxCapacity] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Role editing state
  const [showEditRoleForm, setShowEditRoleForm] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editRoleCapacity, setEditRoleCapacity] = useState(1);
  const [editRoleMaxCapacity, setEditRoleMaxCapacity] = useState<number | undefined>(undefined);
  const [editUseMaxCapacity, setEditUseMaxCapacity] = useState(false);

  // Redirect non-authenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const event = events.find(e => e.id === eventId);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/events"
          className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  
  const handleDeleteEvent = () => {
    deleteEvent(event.id);
    navigate('/events');
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRoleName.trim() && newRoleDescription.trim() && newRoleCapacity > 0) {
      addRole(event.id, {
        name: newRoleName,
        description: newRoleDescription,
        capacity: newRoleCapacity,
        maxCapacity: useMaxCapacity ? newRoleMaxCapacity : undefined
      });
      
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleCapacity(1);
      setNewRoleMaxCapacity(undefined);
      setUseMaxCapacity(false);
      setShowAddRoleForm(false);
    }
  };
  
  const handleEditRole = (roleId: string) => {
    const role = event.roles.find(r => r.id === roleId);
    if (role) {
      setEditRoleId(roleId);
      setEditRoleName(role.name);
      setEditRoleDescription(role.description);
      setEditRoleCapacity(role.capacity);
      setEditRoleMaxCapacity(role.maxCapacity);
      setEditUseMaxCapacity(!!role.maxCapacity);
      setShowEditRoleForm(true);
    }
  };
  
  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editRoleId && editRoleName.trim() && editRoleDescription.trim() && editRoleCapacity > 0) {
      const roleToUpdate = event.roles.find(r => r.id === editRoleId);
      
      if (roleToUpdate) {
        const updatedRole = {
          ...roleToUpdate,
          name: editRoleName,
          description: editRoleDescription,
          capacity: editRoleCapacity,
          maxCapacity: editUseMaxCapacity ? editRoleMaxCapacity : undefined
        };
        
        updateRole(event.id, updatedRole);
        setShowEditRoleForm(false);
      }
    }
  };

  const openVolunteerForm = (roleId: string) => {
    setSelectedRoleId(roleId);
    setShowVolunteerForm(true);
  };

  const copyLandingPageLink = () => {
    if (eventId) {
      const url = event.customUrl 
        ? `${window.location.origin}/event/${event.customUrl}`
        : `${window.location.origin}/event/${eventId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/events" className="text-primary-600 hover:text-primary-800 mb-4 inline-block">
          ← Back to Events
        </Link>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-3xl font-bold">
            {event.name}
            {isPastEvent && (
              <span className="ml-2 text-sm bg-gray-200 text-gray-700 py-1 px-2 rounded-full">
                Past Event
              </span>
            )}
          </h1>
          
          {!isPastEvent && isManager && (
            <div className="flex gap-2">
              <Link
                to={`/events/${event.id}/edit`}
                className="bg-primary-100 text-primary-700 hover:bg-primary-200 px-3 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-4 gap-y-2 sm:gap-x-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              {event.location}
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{event.description}</p>
          
          {/* Landing Page Link Section */}
          {event.landingPageEnabled && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium text-primary-800 flex items-center">
                    <Link2 className="h-4 w-4 mr-1" />
                    Landing Page Available
                  </h3>
                  <p className="text-sm text-primary-700 mt-1">
                    Share this direct link for volunteers to sign up
                  </p>
                  <div className="text-xs text-primary-600 mt-1">
                    {event.customUrl ? (
                      <span>Custom URL: <strong>{window.location.origin}/event/{event.customUrl}</strong></span>
                    ) : (
                      <span>URL: <strong>{window.location.origin}/event/{event.id}</strong></span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={event.customUrl ? `/event/${event.customUrl}` : `/event/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </a>
                  <button
                    onClick={copyLandingPageLink}
                    className="bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Volunteer Roles</h2>
          {!isPastEvent && isManager && (
            <button
              onClick={() => setShowAddRoleForm(true)}
              className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Role
            </button>
          )}
        </div>

        {event.roles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.roles.map(role => {
              const filledSpots = role.volunteers.length;
              const minCapacity = role.capacity;
              const maxCapacity = role.maxCapacity || role.capacity;
              const availableSpots = maxCapacity - filledSpots;
              const isFull = availableSpots <= 0;
              const hasReachedMinimum = filledSpots >= minCapacity;
              
              return (
                <div 
                  key={role.id} 
                  className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                    isFull ? 'border-gray-400' : hasReachedMinimum ? 'border-green-500' : 'border-secondary-500'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{role.name}</h3>
                      {!isPastEvent && isManager && (
                        <button
                          onClick={() => handleEditRole(role.id)}
                          className="text-gray-500 hover:text-primary-600 transition-colors"
                          title="Edit role"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{role.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-5 w-5 mr-2" />
                        <span>
                          {filledSpots}/{role.maxCapacity ? `${minCapacity}-${maxCapacity}` : minCapacity} 
                          {role.maxCapacity ? ' volunteers' : ' needed'}
                        </span>
                      </div>
                      
                      {!isPastEvent && !isFull && (
                        <button
                          onClick={() => openVolunteerForm(role.id)}
                          className="bg-secondary-100 text-secondary-700 hover:bg-secondary-200 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          Volunteer
                        </button>
                      )}
                      
                      {isFull && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm">
                          Full
                        </span>
                      )}
                    </div>
                    
                    {role.volunteers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2">Volunteers:</h4>
                        <ul className="text-sm text-gray-600">
                          {role.volunteers.map(volunteer => (
                            <li key={volunteer.id} className="mb-1">
                              {volunteer.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">No volunteer roles have been created yet.</p>
            {!isPastEvent && isManager && (
              <button
                onClick={() => setShowAddRoleForm(true)}
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add First Role
              </button>
            )}
            {!isPastEvent && !isManager && (
              <div className="text-gray-600 italic">
                Only managers can add volunteer roles
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Role Form Modal */}
      {showAddRoleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Role</h2>
              <form onSubmit={handleAddRole}>
                <div className="mb-4">
                  <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    id="roleName"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="roleDescription"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="roleCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Capacity (number of volunteers needed)
                  </label>
                  <input
                    type="number"
                    id="roleCapacity"
                    value={newRoleCapacity}
                    onChange={(e) => setNewRoleCapacity(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="useMaxCapacity"
                      checked={useMaxCapacity}
                      onChange={() => setUseMaxCapacity(!useMaxCapacity)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useMaxCapacity" className="ml-2 block text-sm text-gray-700">
                      Set maximum capacity (optional)
                    </label>
                  </div>
                  
                  {useMaxCapacity && (
                    <div>
                      <label htmlFor="roleMaxCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Capacity
                      </label>
                      <input
                        type="number"
                        id="roleMaxCapacity"
                        value={newRoleMaxCapacity || ''}
                        onChange={(e) => setNewRoleMaxCapacity(parseInt(e.target.value))}
                        min={newRoleCapacity}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required={useMaxCapacity}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be greater than or equal to the minimum capacity
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRoleForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Add Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Role Form Modal */}
      {showEditRoleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Role</h2>
              <form onSubmit={handleUpdateRole}>
                <div className="mb-4">
                  <label htmlFor="editRoleName" className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    id="editRoleName"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="editRoleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="editRoleDescription"
                    value={editRoleDescription}
                    onChange={(e) => setEditRoleDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="editRoleCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Capacity (number of volunteers needed)
                  </label>
                  <input
                    type="number"
                    id="editRoleCapacity"
                    value={editRoleCapacity}
                    onChange={(e) => setEditRoleCapacity(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="editUseMaxCapacity"
                      checked={editUseMaxCapacity}
                      onChange={() => setEditUseMaxCapacity(!editUseMaxCapacity)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editUseMaxCapacity" className="ml-2 block text-sm text-gray-700">
                      Set maximum capacity (optional)
                    </label>
                  </div>
                  
                  {editUseMaxCapacity && (
                    <div>
                      <label htmlFor="editRoleMaxCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Capacity
                      </label>
                      <input
                        type="number"
                        id="editRoleMaxCapacity"
                        value={editRoleMaxCapacity || ''}
                        onChange={(e) => setEditRoleMaxCapacity(parseInt(e.target.value))}
                        min={editRoleCapacity}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required={editUseMaxCapacity}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be greater than or equal to the minimum capacity
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditRoleForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Update Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Form Modal */}
      {showVolunteerForm && selectedRoleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Volunteer for: {event.roles.find(r => r.id === selectedRoleId)?.name}
              </h2>
              <VolunteerForm
                eventId={event.id}
                roleId={selectedRoleId}
                onClose={() => setShowVolunteerForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Delete Event</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{event.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
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

export default EventDetailPage;
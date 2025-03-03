import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Event, Role, Volunteer } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../api';

interface AppContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'roles'>) => Promise<string | null>;
  updateEvent: (event: Event) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  addRole: (eventId: string, role: Omit<Role, 'id' | 'volunteers'>) => Promise<string | null>;
  updateRole: (eventId: string, role: Role) => Promise<boolean>;
  deleteRole: (eventId: string, roleId: string) => Promise<boolean>;
  addVolunteer: (eventId: string, roleId: string, volunteer: Omit<Volunteer, 'id' | 'roleId'>) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load events from server
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const fetchedEvents = await api.fetchEvents();
        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Error loading data:', err instanceof Error ? err.message : 'Unknown error');
        setError('Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  const addEvent = async (event: Omit<Event, 'id' | 'roles'>): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const newEventId = uuidv4();
      
      // Create new event object
      const newEvent: Event = {
        ...event,
        id: newEventId,
        roles: [],
      };
      
      // Save to server
      const savedEvent = await api.saveEvent(newEvent);
      
      if (savedEvent) {
        // Update local state
        setEvents(prev => [...prev, newEvent]);
        return newEventId;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding event:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  const updateEvent = async (updatedEvent: Event): Promise<boolean> => {
    try {
      // Update on server
      const success = await api.updateEvent(updatedEvent);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        ));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating event:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      // Delete from server
      const success = await api.deleteEvent(eventId);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.filter(event => event.id !== eventId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting event:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const addRole = async (eventId: string, role: Omit<Role, 'id' | 'volunteers'>): Promise<string | null> => {
    try {
      const newRoleId = uuidv4();
      
      // Create new role object
      const newRole: Role = {
        ...role,
        id: newRoleId,
        volunteers: [],
      };
      
      // Find the event to update
      const eventToUpdate = events.find(e => e.id === eventId);
      
      if (!eventToUpdate) {
        return null;
      }
      
      // Create updated event with new role
      const updatedEvent: Event = {
        ...eventToUpdate,
        roles: [...eventToUpdate.roles, newRole],
      };
      
      // Update on server
      const success = await api.updateEvent(updatedEvent);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return updatedEvent;
          }
          return event;
        }));
        
        return newRoleId;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding role:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  const updateRole = async (eventId: string, updatedRole: Role): Promise<boolean> => {
    try {
      // Find the event to update
      const eventToUpdate = events.find(e => e.id === eventId);
      
      if (!eventToUpdate) {
        return false;
      }
      
      // Create updated event with updated role
      const updatedEvent: Event = {
        ...eventToUpdate,
        roles: eventToUpdate.roles.map(role => 
          role.id === updatedRole.id ? updatedRole : role
        ),
      };
      
      // Update on server
      const success = await api.updateEvent(updatedEvent);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return updatedEvent;
          }
          return event;
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating role:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const deleteRole = async (eventId: string, roleId: string): Promise<boolean> => {
    try {
      // Find the event to update
      const eventToUpdate = events.find(e => e.id === eventId);
      
      if (!eventToUpdate) {
        return false;
      }
      
      // Create updated event without the role
      const updatedEvent: Event = {
        ...eventToUpdate,
        roles: eventToUpdate.roles.filter(role => role.id !== roleId),
      };
      
      // Update on server
      const success = await api.updateEvent(updatedEvent);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return updatedEvent;
          }
          return event;
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting role:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const addVolunteer = async (
    eventId: string, 
    roleId: string, 
    volunteer: Omit<Volunteer, 'id' | 'roleId'>
  ): Promise<string | null> => {
    try {
      const newVolunteerId = uuidv4();
      
      // Create new volunteer object
      const newVolunteer: Volunteer = {
        ...volunteer,
        id: newVolunteerId,
        roleId,
      };
      
      // Find the event to update
      const eventToUpdate = events.find(e => e.id === eventId);
      
      if (!eventToUpdate) {
        return null;
      }
      
      // Create updated event with new volunteer in the specified role
      const updatedEvent: Event = {
        ...eventToUpdate,
        roles: eventToUpdate.roles.map(role => {
          if (role.id === roleId) {
            return {
              ...role,
              volunteers: [...role.volunteers, newVolunteer],
            };
          }
          return role;
        }),
      };
      
      // Update on server
      const success = await api.updateEvent(updatedEvent);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return updatedEvent;
          }
          return event;
        }));
        
        return newVolunteerId;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding volunteer:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  return (
    <AppContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        addRole,
        updateRole,
        deleteRole,
        addVolunteer,
        isLoading,
        error
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
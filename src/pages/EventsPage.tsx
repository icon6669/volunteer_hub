import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Calendar, MapPin, Plus, Users, LogIn } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const EventsPage: React.FC = () => {
  const { events } = useAppContext();
  const { isAuthenticated, isManager } = useAuth();
  
  // Redirect non-authenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Sort events by date (upcoming first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        {isManager ? (
          <Link
            to="/events/new"
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Event
          </Link>
        ) : (
          <div className="text-sm text-gray-600 italic">
            Only managers can create events
          </div>
        )}
      </div>

      {sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {sortedEvents.map(event => {
            const eventDate = new Date(event.date);
            const isPastEvent = eventDate < new Date();
            const totalVolunteers = event.roles.reduce(
              (sum, role) => sum + role.volunteers.length, 0
            );
            const totalMinCapacity = event.roles.reduce(
              (sum, role) => sum + role.capacity, 0
            );
            const totalMaxCapacity = event.roles.reduce(
              (sum, role) => sum + (role.maxCapacity || role.capacity), 0
            );
            const hasRangeCapacity = totalMinCapacity !== totalMaxCapacity;
            
            return (
              <div 
                key={event.id} 
                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-l-4 ${
                  isPastEvent ? 'border-gray-400' : 'border-primary-500'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">
                        {event.name}
                        {isPastEvent && (
                          <span className="ml-2 text-sm bg-gray-200 text-gray-700 py-1 px-2 rounded-full">
                            Past Event
                          </span>
                        )}
                      </h2>
                      
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
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-5 w-5 mr-2" />
                        <span>
                          {totalVolunteers}/{hasRangeCapacity ? `${totalMinCapacity}-${totalMaxCapacity}` : totalMinCapacity} volunteers
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.roles.length} role{event.roles.length !== 1 ? 's' : ''}
                      </div>
                      <Link
                        to={`/events/${event.id}`}
                        className="mt-2 bg-primary-100 text-primary-700 hover:bg-primary-200 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No events yet</h2>
          <p className="text-gray-600 mb-6">Create your first event to get started.</p>
          {isManager ? (
            <Link
              to="/events/new"
              className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Event
            </Link>
          ) : (
            <div className="text-gray-600 italic">
              Only managers can create events
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
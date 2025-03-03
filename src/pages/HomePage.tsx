import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, UserPlus, ClipboardList, LogIn, BarChart, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { events } = useAppContext();
  const { isAuthenticated, isManager } = useAuth();
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Calculate some basic metrics for the homepage
  const totalEvents = events.length;
  const totalVolunteers = events.reduce((sum, event) => 
    sum + event.roles.reduce((roleSum, role) => 
      roleSum + role.volunteers.length, 0
    ), 0
  );
  
  const totalRoles = events.reduce((sum, event) => sum + event.roles.length, 0);
  
  const totalMinCapacity = events.reduce((sum, event) => 
    sum + event.roles.reduce((roleSum, role) => 
      roleSum + role.capacity, 0
    ), 0
  );
  
  const fillRate = totalMinCapacity > 0 
    ? Math.round((totalVolunteers / totalMinCapacity) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="bg-gradient-to-r from-primary-800 to-secondary-700 rounded-xl shadow-xl overflow-hidden">
          <div className="px-8 py-16 md:px-16 md:py-20 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Volunteer Management Made Simple
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl">
              Create events, manage volunteer roles, and coordinate your team all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/events"
                className="bg-white text-primary-800 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Browse Events
              </Link>
              {isAuthenticated ? (
                isManager ? (
                  <Link
                    to="/dashboard"
                    className="bg-secondary-600 text-white hover:bg-secondary-500 px-6 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
                  >
                    <BarChart className="mr-2 h-5 w-5" />
                    View Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/events"
                    className="bg-secondary-600 text-white hover:bg-secondary-500 px-6 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Volunteer Now
                  </Link>
                )
              ) : (
                <Link
                  to="/login"
                  className="bg-secondary-600 text-white hover:bg-secondary-500 px-6 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section - Only visible to authenticated users */}
      {isAuthenticated && events.length > 0 && (
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-primary-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Total Events</p>
                  <h3 className="text-3xl font-bold mt-1">{totalEvents}</h3>
                </div>
                <div className="bg-primary-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-secondary-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Total Volunteers</p>
                  <h3 className="text-3xl font-bold mt-1">{totalVolunteers}</h3>
                </div>
                <div className="bg-secondary-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-accent-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Fill Rate</p>
                  <h3 className="text-3xl font-bold mt-1">{fillRate}%</h3>
                </div>
                <div className="bg-accent-100 p-3 rounded-full">
                  <BarChart className="h-6 w-6 text-accent-600" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <Link to="/events" className="text-primary-600 hover:text-primary-800">
            View all events →
          </Link>
        </div>

        {/* Only show upcoming events to authenticated users */}
        {isAuthenticated && upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {event.roles.length} role{event.roles.length !== 1 ? 's' : ''} available
                  </p>
                  <Link
                    to={`/events/${event.id}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-800"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : isAuthenticated && upcomingEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No upcoming events yet.</p>
            {isManager ? (
              <Link
                to="/events/new"
                className="inline-flex items-center bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Create your first event
              </Link>
            ) : (
              <p className="text-gray-600">
                Check back later for upcoming volunteer opportunities
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Sign in to view upcoming events.</p>
            <Link
              to="/login"
              className="inline-flex items-center bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign in
            </Link>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-primary-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Events</h3>
            <p className="text-gray-600">
              Set up events with all the details including date, location, and description.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-secondary-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Define Roles</h3>
            <p className="text-gray-600">
              Create specific volunteer roles with descriptions and capacity limits.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-accent-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-accent-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
            <p className="text-gray-600">
              Monitor volunteer sign-ups and analyze event metrics through the dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Sign In Options</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700 mb-4">
            Volunteer Hub offers multiple ways to sign in for your convenience:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 flex items-center">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-sm text-gray-500">Sign in with your email address</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 flex items-center">
              <div className="bg-blue-50 p-2 rounded-full mr-3">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
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
              </div>
              <div>
                <h3 className="font-medium">Google</h3>
                <p className="text-sm text-gray-500">Optional sign in with Google</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 flex items-center">
              <div className="bg-blue-50 p-2 rounded-full mr-3">
                <svg className="h-6 w-6" fill="#1877F2" viewBox="0 0 24 24">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Facebook</h3>
                <p className="text-sm text-gray-500">Optional sign in with Facebook</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign In Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
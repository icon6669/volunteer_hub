import React, { useState } from 'react';
import { useParams, Link, useSearchParams, Navigate } from 'react-router-dom';
import { Calendar, MapPin, Users, AlertCircle, ArrowLeft, ExternalLink, LogIn } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import VolunteerForm from '../components/VolunteerForm';

const EventLandingPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { events } = useAppContext();
  const { isAuthenticated } = useAuth();
  
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Find event by ID or custom URL
  const event = events.find(e => 
    e.id === eventId || (e.customUrl && e.customUrl === eventId)
  );
  
  // If event doesn't exist or landing page is not enabled
  if (!event || (!event.landingPageEnabled && !isPreview)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="mb-6">The event you're looking for doesn't exist or the landing page is not available.</p>
          <Link
            to="/"
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  
  // Get theme classes based on the selected theme
  const getThemeClasses = () => {
    switch (event.landingPageTheme) {
      case 'dark':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          card: 'bg-gray-800 border-gray-700',
          button: 'bg-primary-600 hover:bg-primary-700 text-white',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-white',
          header: 'bg-gray-800',
          highlight: 'text-primary-400'
        };
      case 'light':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-800',
          card: 'bg-white border-gray-200',
          button: 'bg-primary-600 hover:bg-primary-700 text-white',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
          header: 'bg-white',
          highlight: 'text-primary-600'
        };
      case 'colorful':
        return {
          background: 'bg-gradient-to-br from-purple-50 to-pink-50',
          text: 'text-gray-800',
          card: 'bg-white border-gray-200',
          button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
          secondaryButton: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300',
          header: 'bg-gradient-to-r from-purple-600 to-pink-600',
          highlight: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-800',
          card: 'bg-white border-gray-200',
          button: 'bg-primary-600 hover:bg-primary-700 text-white',
          secondaryButton: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300',
          header: 'bg-primary-600',
          highlight: 'text-primary-600'
        };
    }
  };
  
  const theme = getThemeClasses();
  
  const openVolunteerForm = (roleId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    setSelectedRoleId(roleId);
    setShowVolunteerForm(true);
  };
  
  return (
    <div className={`min-h-screen ${theme.background} ${theme.text}`}>
      {/* Header */}
      <header className={`${theme.header} text-white py-6`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Volunteer Hub</h1>
            {isPreview && (
              <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                Preview Mode
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="relative">
        {event.landingPageImage && (
          <div className="h-64 md:h-80 w-full overflow-hidden">
            <img 
              src={event.landingPageImage} 
              alt={event.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        )}
        
        <div className={`container mx-auto px-4 py-8 ${event.landingPageImage ? 'relative -mt-32 z-10' : ''}`}>
          <div className={`${theme.card} rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto`}>
            <div className="p-6 md:p-8">
              <Link
                to="/"
                className="inline-flex items-center text-sm font-medium mb-4 hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to main site
              </Link>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {event.landingPageTitle || event.name}
                {isPastEvent && (
                  <span className="ml-2 text-sm bg-red-100 text-red-700 py-1 px-2 rounded-full">
                    Past Event
                  </span>
                )}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 dark:text-gray-300 mb-6 gap-y-2 sm:gap-x-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                  {event.location}
                </div>
              </div>
              
              <div className="prose max-w-none mb-8 text-gray-700 dark:text-gray-300">
                <p>{event.landingPageDescription || event.description}</p>
              </div>
              
              <div className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${theme.highlight}`}>
                  Volunteer Opportunities
                </h2>
                
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
                          className={`${theme.card} rounded-lg shadow-sm overflow-hidden border-l-4 ${
                            isFull ? 'border-gray-400' : hasReachedMinimum ? 'border-green-500' : 'border-secondary-500'
                          }`}
                        >
                          <div className="p-5">
                            <h3 className="text-xl font-semibold mb-2">{role.name}</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">{role.description}</p>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Users className="h-5 w-5 mr-2" />
                                <span>
                                  {filledSpots}/{role.maxCapacity ? `${minCapacity}-${maxCapacity}` : minCapacity} 
                                  {role.maxCapacity ? ' volunteers' : ' needed'}
                                </span>
                              </div>
                              
                              {!isPastEvent && !isFull && !isPreview && (
                                <button
                                  onClick={() => openVolunteerForm(role.id)}
                                  className={`${theme.button} px-3 py-1 rounded-lg text-sm font-medium transition-colors`}
                                >
                                  Volunteer
                                </button>
                              )}
                              
                              {isPreview && (
                                <button
                                  className={`${theme.button} px-3 py-1 rounded-lg text-sm font-medium transition-colors opacity-70 cursor-not-allowed`}
                                >
                                  Volunteer
                                </button>
                              )}
                              
                              {isFull && (
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-sm">
                                  Full
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`${theme.card} rounded-lg p-6 text-center`}>
                    <p className="text-gray-600 dark:text-gray-400">
                      No volunteer roles have been created yet.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <Link
                  to="/"
                  className={`${theme.secondaryButton} px-4 py-2 rounded-lg font-medium transition-colors flex items-center`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Main Website
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={`mt-12 py-6 ${theme.header === 'bg-white' ? 'bg-gray-100' : theme.header} ${theme.header === 'bg-white' ? 'text-gray-700' : 'text-white'}`}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Volunteer Hub. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Volunteer Form Modal */}
      {showVolunteerForm && selectedRoleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
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
      
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Sign In Required
              </h2>
              <p className="mb-6 text-gray-600">
                You need to sign in to volunteer for this event.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLandingPage;
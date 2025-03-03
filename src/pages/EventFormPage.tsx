import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Image, Link2, Copy, AlertCircle, CheckCircle } from 'lucide-react';

const EventFormPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, addEvent, updateEvent } = useAppContext();
  const { isAuthenticated, isManager } = useAuth();
  
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [landingPageEnabled, setLandingPageEnabled] = useState(false);
  const [landingPageTitle, setLandingPageTitle] = useState('');
  const [landingPageDescription, setLandingPageDescription] = useState('');
  const [landingPageImage, setLandingPageImage] = useState('');
  const [landingPageTheme, setLandingPageTheme] = useState<'default' | 'dark' | 'light' | 'colorful'>('default');
  const [showLandingPagePreview, setShowLandingPagePreview] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Custom URL state
  const [customUrl, setCustomUrl] = useState('');
  const [isCustomUrlValid, setIsCustomUrlValid] = useState(true);
  const [customUrlError, setCustomUrlError] = useState('');
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  
  // Redirect non-authenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Redirect non-managers to home
  if (!isManager) {
    return <Navigate to="/" />;
  }
  
  const isEditMode = !!eventId;
  
  useEffect(() => {
    if (isEditMode) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setName(event.name);
        // Format date for input[type="date"]
        const eventDate = new Date(event.date);
        setDate(eventDate.toISOString().split('T')[0]);
        setLocation(event.location);
        setDescription(event.description);
        
        // Set landing page fields if they exist
        setLandingPageEnabled(!!event.landingPageEnabled);
        setLandingPageTitle(event.landingPageTitle || event.name);
        setLandingPageDescription(event.landingPageDescription || event.description);
        setLandingPageImage(event.landingPageImage || '');
        setLandingPageTheme(event.landingPageTheme || 'default');
        
        // Set custom URL if it exists
        setCustomUrl(event.customUrl || '');
      } else {
        // If event not found, redirect to events page
        navigate('/events');
      }
    } else {
      // Set default date to tomorrow for new events
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [eventId, events, isEditMode, navigate]);
  
  const validateCustomUrl = (url: string) => {
    // Reset validation state
    setIsCustomUrlValid(true);
    setCustomUrlError('');
    
    // If empty, it's valid (we'll use the default ID)
    if (!url.trim()) {
      return true;
    }
    
    // Check for valid characters (letters, numbers, hyphens, underscores)
    const validUrlPattern = /^[a-zA-Z0-9-_]+$/;
    if (!validUrlPattern.test(url)) {
      setIsCustomUrlValid(false);
      setCustomUrlError('URL can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    
    // Check if URL is already in use by another event
    const isUrlTaken = events.some(e => 
      e.customUrl === url && e.id !== eventId
    );
    
    if (isUrlTaken) {
      setIsCustomUrlValid(false);
      setCustomUrlError('This URL is already in use by another event');
      return false;
    }
    
    return true;
  };
  
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setCustomUrl(newUrl);
    
    // Validate after a short delay to avoid validating on every keystroke
    setIsCheckingUrl(true);
    setTimeout(() => {
      validateCustomUrl(newUrl);
      setIsCheckingUrl(false);
    }, 500);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation of custom URL
    if (!validateCustomUrl(customUrl)) {
      return;
    }
    
    if (name.trim() && date && location.trim() && description.trim()) {
      const eventData = {
        name,
        date,
        location,
        description,
        landingPageEnabled,
        landingPageTitle: landingPageEnabled ? landingPageTitle : undefined,
        landingPageDescription: landingPageEnabled ? landingPageDescription : undefined,
        landingPageImage: landingPageEnabled ? landingPageImage : undefined,
        landingPageTheme: landingPageEnabled ? landingPageTheme : undefined,
        customUrl: landingPageEnabled && customUrl.trim() ? customUrl.trim() : undefined
      };
      
      if (isEditMode && eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          updateEvent({
            ...event,
            ...eventData
          });
        }
      } else {
        addEvent(eventData);
      }
      
      navigate('/events');
    }
  };
  
  const copyLandingPageLink = () => {
    if (eventId) {
      const url = customUrl 
        ? `${window.location.origin}/event/${customUrl}`
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
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Event Details</h2>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  required
                />
              </div>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold">Landing Page</h2>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="landingPageEnabled"
                    checked={landingPageEnabled}
                    onChange={(e) => setLandingPageEnabled(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="landingPageEnabled" className="ml-2 block text-sm text-gray-700">
                    Enable landing page
                  </label>
                </div>
              </div>
              
              {landingPageEnabled && (
                <>
                  {isEditMode && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Landing Page URL</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Share this link for direct volunteer sign-up
                          </p>
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowLandingPagePreview(true)}
                            className="mr-2 text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={copyLandingPageLink}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {copied ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Custom URL (optional)
                    </label>
                    <div className="flex items-center">
                      <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md text-gray-500">
                        {window.location.origin}/event/
                      </span>
                      <input
                        type="text"
                        id="customUrl"
                        value={customUrl}
                        onChange={handleCustomUrlChange}
                        className={`flex-grow px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 ${
                          isCustomUrlValid ? 'focus:ring-primary-500' : 'border-red-500 focus:ring-red-500'
                        }`}
                        placeholder={isEditMode ? eventId : "my-awesome-event"}
                      />
                    </div>
                    {isCheckingUrl && (
                      <p className="text-xs text-gray-500 mt-1">
                        Checking URL availability...
                      </p>
                    )}
                    {!isCustomUrlValid && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {customUrlError}
                      </p>
                    )}
                    {isCustomUrlValid && customUrl && (
                      <p className="text-xs text-green-500 mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        URL is available
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Create a custom URL for easier sharing. Leave blank to use the default URL.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="landingPageTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Landing Page Title
                    </label>
                    <input
                      type="text"
                      id="landingPageTitle"
                      value={landingPageTitle}
                      onChange={(e) => setLandingPageTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={name}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to use the event name
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="landingPageDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Landing Page Description
                    </label>
                    <textarea
                      id="landingPageDescription"
                      value={landingPageDescription}
                      onChange={(e) => setLandingPageDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder={description}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to use the event description
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="landingPageImage" className="block text-sm font-medium text-gray-700 mb-1">
                      Landing Page Image URL
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="landingPageImage"
                        value={landingPageImage}
                        onChange={(e) => setLandingPageImage(e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://example.com/image.jpg"
                      />
                      <div className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md flex items-center">
                        <Image className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL for the header image (optional)
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landing Page Theme
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => setLandingPageTheme('default')}
                        className={`p-3 rounded-md border ${
                          landingPageTheme === 'default'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="h-8 bg-primary-600 rounded-t-sm"></div>
                        <div className="h-16 bg-white border-x border-b border-gray-300 rounded-b-sm"></div>
                        <div className="mt-2 text-sm font-medium">Default</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setLandingPageTheme('dark')}
                        className={`p-3 rounded-md border ${
                          landingPageTheme === 'dark'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="h-8 bg-gray-800 rounded-t-sm"></div>
                        <div className="h-16 bg-gray-700 rounded-b-sm"></div>
                        <div className="mt-2 text-sm font-medium">Dark</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setLandingPageTheme('light')}
                        className={`p-3 rounded-md border ${
                          landingPageTheme === 'light'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="h-8 bg-gray-100 rounded-t-sm"></div>
                        <div className="h-16 bg-white border-x border-b border-gray-200 rounded-b-sm"></div>
                        <div className="mt-2 text-sm font-medium">Light</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setLandingPageTheme('colorful')}
                        className={`p-3 rounded-md border ${
                          landingPageTheme === 'colorful'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-sm"></div>
                        <div className="h-16 bg-white border-x border-b border-gray-200 rounded-b-sm"></div>
                        <div className="mt-2 text-sm font-medium">Colorful</div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link
                to="/events"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isEditMode ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventFormPage;
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Settings, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Facebook, 
  Mail, 
  Globe, 
  Eye, 
  EyeOff,
  Palette,
  Image,
  Database,
  Loader
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { updateProviderSettings } from '../firebase';
import { supabase } from '../supabase';

const SystemSettingsPage: React.FC = () => {
  const { settings, updateSettings, isLoading: settingsLoading, error: settingsError } = useSettings();
  const { isAuthenticated, isOwner } = useAuth();
  
  const [formData, setFormData] = useState({
    googleAuthEnabled: settings.googleAuthEnabled,
    googleClientId: settings.googleClientId || '',
    googleClientSecret: settings.googleClientSecret || '',
    facebookAuthEnabled: settings.facebookAuthEnabled,
    facebookAppId: settings.facebookAppId || '',
    facebookAppSecret: settings.facebookAppSecret || '',
    organizationName: settings.organizationName,
    organizationLogo: settings.organizationLogo || '',
    primaryColor: settings.primaryColor || '#0ea5e9',
    allowPublicEventViewing: settings.allowPublicEventViewing
  });
  
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showFacebookSecret, setShowFacebookSecret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(!!supabase);
  const [supabaseConnectionError, setSupabaseConnectionError] = useState('');
  
  // Redirect if not authenticated or not owner
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="mb-6 text-gray-600">
            System settings are only accessible to the system owner. You don't have the required permissions.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state while settings are being fetched
  if (settingsLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <Loader className="h-16 w-16 mx-auto text-primary-500 mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-4">Loading Settings</h1>
          <p className="mb-6 text-gray-600">
            Please wait while we load your system settings...
          </p>
        </div>
      </div>
    );
  }
  
  // Show error if settings couldn't be loaded
  if (settingsError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Error Loading Settings</h1>
          <p className="mb-6 text-gray-600">
            {settingsError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError('');
    setIsSubmitting(true);
    
    try {
      // Validate required fields if auth is enabled
      if (formData.googleAuthEnabled) {
        if (!formData.googleClientId || !formData.googleClientSecret) {
          setSaveError('Google Client ID and Client Secret are required when Google Auth is enabled');
          setIsSubmitting(false);
          return;
        }
      }
      
      if (formData.facebookAuthEnabled) {
        if (!formData.facebookAppId || !formData.facebookAppSecret) {
          setSaveError('Facebook App ID and App Secret are required when Facebook Auth is enabled');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Check if Supabase is connected
      if (!supabaseConnected) {
        setSaveError('Supabase connection is required to save settings. Please connect to Supabase first.');
        setIsSubmitting(false);
        return;
      }
      
      // Update settings in Supabase
      const success = await updateSettings(formData);
      
      if (success) {
        // Update provider settings in Firebase
        updateProviderSettings();
        
        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('Failed to save settings to Supabase. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('An error occurred while saving settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('count').single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine for this check
        setSupabaseConnected(false);
        setSupabaseConnectionError(`Failed to connect to Supabase: ${error.message}`);
        return;
      }
      
      setSupabaseConnected(true);
      setSupabaseConnectionError('');
    } catch (error: any) {
      setSupabaseConnected(false);
      setSupabaseConnectionError(`Failed to connect to Supabase: ${error.message || 'Unknown error'}`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="mr-2 h-6 w-6 text-primary-600" />
          System Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure authentication providers and system preferences
        </p>
      </div>
      
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Settings saved successfully
        </div>
      )}
      
      {saveError && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {saveError}
        </div>
      )}
      
      {/* Supabase Connection Status */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <Database className="mr-2 h-5 w-5 text-primary-600" />
            Database Connection
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Connect to Supabase to store your application settings securely
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Supabase Connection Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                Settings are stored securely in Supabase
              </p>
            </div>
            <div className="flex items-center">
              {supabaseConnected ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Not Connected
                </span>
              )}
            </div>
          </div>
          
          {supabaseConnectionError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {supabaseConnectionError}
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600 mb-4">
              To use Supabase for storing application settings, you need to connect your Supabase project.
              Click the "Connect to Supabase" button in the top right corner of the editor to set up your connection.
            </p>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={checkSupabaseConnection}
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Database className="h-5 w-5 mr-2" />
                Test Connection
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary-600" />
              Authentication Providers
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure which authentication methods are available to users
            </p>
          </div>
          
          <div className="p-6">
            {/* Google Authentication */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24">
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
                  <h3 className="text-lg font-medium">Google Authentication</h3>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="googleAuthEnabled"
                    name="googleAuthEnabled"
                    checked={formData.googleAuthEnabled}
                    onChange={handleInputChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label
                    htmlFor="googleAuthEnabled"
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                      formData.googleAuthEnabled ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  ></label>
                </div>
              </div>
              
              {formData.googleAuthEnabled && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-4">
                    <label htmlFor="googleClientId" className="block text-sm font-medium text-gray-700 mb-1">
                      Google Client ID
                    </label>
                    <input
                      type="text"
                      id="googleClientId"
                      name="googleClientId"
                      value={formData.googleClientId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your Google Client ID"
                      required={formData.googleAuthEnabled}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label htmlFor="googleClientSecret" className="block text-sm font-medium text-gray-700 mb-1">
                      Google Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showGoogleSecret ? "text" : "password"}
                        id="googleClientSecret"
                        name="googleClientSecret"
                        value={formData.googleClientSecret}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your Google Client Secret"
                        required={formData.googleAuthEnabled}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                      >
                        {showGoogleSecret ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    To enable Google authentication, you need to create a project in the Google Developer Console and configure OAuth credentials.
                  </p>
                </div>
              )}
            </div>
            
            {/* Facebook Authentication */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Facebook className="h-6 w-6 mr-2 text-[#1877F2]" />
                  <h3 className="text-lg font-medium">Facebook Authentication</h3>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="facebookAuthEnabled"
                    name="facebookAuthEnabled"
                    checked={formData.facebookAuthEnabled}
                    onChange={handleInputChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label
                    htmlFor="facebookAuthEnabled"
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                      formData.facebookAuthEnabled ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  ></label>
                </div>
              </div>
              
              {formData.facebookAuthEnabled && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-4">
                    <label htmlFor="facebookAppId" className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook App ID
                    </label>
                    <input
                      type="text"
                      id="facebookAppId"
                      name="facebookAppId"
                      value={formData.facebookAppId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your Facebook App ID"
                      required={formData.facebookAuthEnabled}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label htmlFor="facebookAppSecret" className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook App Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showFacebookSecret ? "text" : "password"}
                        id="facebookAppSecret"
                        name="facebookAppSecret"
                        value={formData.facebookAppSecret}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your Facebook App Secret"
                        required={formData.facebookAuthEnabled}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowFacebookSecret(!showFacebookSecret)}
                      >
                        {showFacebookSecret ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    To enable Facebook authentication, you need to create an app in the Facebook Developer Portal and configure OAuth settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Globe className="mr-2 h-5 w-5 text-primary-600" />
              Organization Settings
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure your organization details and appearance
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your organization name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="organizationLogo" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Logo URL (optional)
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="organizationLogo"
                  name="organizationLogo"
                  value={formData.organizationLogo}
                  onChange={handleInputChange}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/logo.png"
                />
                <div className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md flex items-center">
                  <Image className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter a URL for your organization logo. Recommended size: 200x50px.
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="primaryColor"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="h-10 w-10 border-0 p-0 mr-2"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  name="primaryColor"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="#0ea5e9"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Choose a primary color for your organization's branding.
              </p>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowPublicEventViewing"
                  name="allowPublicEventViewing"
                  checked={formData.allowPublicEventViewing}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="allowPublicEventViewing" className="ml-2 block text-sm text-gray-700">
                  Allow public event viewing (without login)
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                If enabled, events will be visible to users who are not logged in.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !supabaseConnected}
            className={`bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
              (isSubmitting || !supabaseConnected) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <Loader className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettingsPage;
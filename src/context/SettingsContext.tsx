import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SystemSettings } from '../types';
import * as api from '../api';

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<boolean>;
  isGoogleAuthEnabled: boolean;
  isFacebookAuthEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    googleAuthEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    facebookAuthEnabled: false,
    facebookAppId: '',
    facebookAppSecret: '',
    organizationName: 'Volunteer Hub',
    organizationLogo: '',
    primaryColor: '#0ea5e9', // primary-600
    allowPublicEventViewing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from server on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedSettings = await api.fetchSettings();
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Failed to load settings:', err instanceof Error ? err.message : 'Unknown error');
        setError('Failed to load application settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<boolean> => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };
      
      const success = await api.saveSettings(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
      }
      
      return success;
    } catch (err) {
      console.error('Failed to update settings:', err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const isGoogleAuthEnabled = settings.googleAuthEnabled && 
    !!settings.googleClientId && 
    !!settings.googleClientSecret;

  const isFacebookAuthEnabled = settings.facebookAuthEnabled && 
    !!settings.facebookAppId && 
    !!settings.facebookAppSecret;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isGoogleAuthEnabled,
        isFacebookAuthEnabled,
        isLoading,
        error
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
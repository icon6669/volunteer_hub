import { SystemSettings } from '../types';

/**
 * Safely parses system settings from JSON string to SystemSettings object
 * @param settingsJson - JSON string from the database
 * @returns Parsed SystemSettings object with defaults for missing values
 */
export const parseSystemSettings = (settingsJson: string | null | undefined): SystemSettings => {
  const defaultSettings = {
    googleAuthEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    facebookAuthEnabled: false,
    facebookAppId: '',
    facebookAppSecret: '',
    landingPageTheme: 'light',
    organizationName: 'Volunteer Hub',
    organizationLogo: '',
    primaryColor: '#3b82f6',
    allowPublicEventViewing: true
  } as SystemSettings;

  if (!settingsJson) {
    return defaultSettings;
  }

  try {
    const parsedSettings = JSON.parse(settingsJson);
    return {
      ...defaultSettings,
      ...parsedSettings
    } as SystemSettings;
  } catch (error) {
    console.error('Error parsing system settings:', error);
    return defaultSettings;
  }
};

/**
 * Safely stringifies SystemSettings object to JSON string
 * @param settings - SystemSettings object
 * @returns JSON string representation of the settings
 */
export const stringifySystemSettings = (settings: SystemSettings): string => {
  try {
    return JSON.stringify(settings, null, 2);
  } catch (error) {
    console.error('Error stringifying system settings:', error);
    return '{}';
  }
};

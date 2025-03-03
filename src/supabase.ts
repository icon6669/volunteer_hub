import { createClient } from '@supabase/supabase-js';
import { SystemSettings } from './types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client if credentials are available
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Default settings
export const defaultSettings: SystemSettings = {
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
};

console.log('Supabase connection status:', supabase ? 'Connected' : 'Not connected');
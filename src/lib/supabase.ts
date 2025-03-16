import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables based on the current environment
const getEnvVariable = (key: string): string | undefined => {
  // Check if window.ENV exists (production build)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  
  // For development with Vite
  if (import.meta && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Fallback to process.env for tests
  return process.env[key];
};

// Ensure URLs are properly formatted
const formatUrl = (url: string | undefined) => {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `https://${url}`;
};

const supabaseUrl = formatUrl(getEnvVariable('VITE_SUPABASE_URL'));
const supabaseAnonKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', { 
    window_env: typeof window !== 'undefined' ? window.ENV : 'not available',
    vite_env: import.meta && import.meta.env ? Object.keys(import.meta.env) : 'not available',
    process_env: process.env ? 'available' : 'not available'
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export const handleDbError = (error: any): never => {
  console.error('Database error:', error);
  
  if (error?.code === '23505') {
    throw new SupabaseError('A record with this information already exists', error.code);
  }
  
  if (error?.code === '23503') {
    throw new SupabaseError('Referenced record does not exist', error.code);
  }
  
  throw new SupabaseError(error?.message || 'An unexpected database error occurred', error?.code);
};
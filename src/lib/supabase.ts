import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
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
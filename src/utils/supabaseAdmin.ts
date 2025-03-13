import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { User } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges
// This should only be used server-side in a secure environment
// For client-side code, continue using the regular supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Only initialize if we have the service role key (server-side)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Creates a new user record in the users table after signup, bypassing RLS
 * This function should only be called from a secure server environment
 * 
 * @param user - The user object from Supabase Auth
 * @param isFirstUser - Whether this is the first user in the system
 * @returns Promise resolving to success boolean
 */
export const createUserRecordServerSide = async (
  user: User,
  isFirstUser: boolean
): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized - missing service role key');
    return false;
  }

  try {
    // Determine the role based on whether this is the first user
    const role = isFirstUser ? 'owner' : 'volunteer';
    
    // Insert the user with the appropriate role
    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        user_role: role,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating user record server-side:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createUserRecordServerSide:', error);
    return false;
  }
};

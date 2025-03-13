import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * Sets a user's role in the database
 * @param userId - The ID of the user
 * @param role - The role to set ('admin', 'owner', 'manager', or 'volunteer')
 * @returns Promise resolving to success boolean
 */
export const setUserRole = async (userId: string, role: 'admin' | 'owner' | 'manager' | 'volunteer'): Promise<boolean> => {
  try {
    // Check if user exists in the users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking user:', checkError);
      throw checkError;
    }
    
    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({ user_role: role })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user role:', updateError);
        throw updateError;
      }
    } else {
      // Insert new user record
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          user_role: role
        });
      
      if (insertError) {
        console.error('Error inserting user role:', insertError);
        throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in setUserRole:', error);
    return false;
  }
};

/**
 * Creates a new user record in the users table after signup
 * @param user - The user object from Supabase Auth
 * @param role - Optional role to set (defaults to 'volunteer')
 * @returns Promise resolving to success boolean
 */
export const createUserRecord = async (
  user: User,
  role: 'admin' | 'owner' | 'manager' | 'volunteer' = 'volunteer'
): Promise<boolean> => {
  try {
    // First check if the user already exists to avoid duplicate entries
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing user:', checkError);
      // Continue with insertion attempt even if check fails
    }
    
    // If user already exists, update their role instead of inserting
    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: user.email,
          user_role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating existing user record:', updateError);
        throw updateError;
      }
      
      return true;
    }
    
    // Insert new user record if they don't exist
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        user_role: role,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating user record:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    return false;
  }
};

/**
 * Gets all users with their roles
 * @returns Promise resolving to array of user objects with roles
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, user_role, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
};

/**
 * Deletes a user from the users table
 * @param userId - The ID of the user to delete
 * @returns Promise resolving to success boolean
 */
export const deleteUserRecord = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteUserRecord:', error);
    return false;
  }
};

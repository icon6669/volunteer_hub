import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserRole } from '../types';

/**
 * Sets a user's role in the database
 * @param userId - The ID of the user
 * @param role - The role to set ('admin', 'owner', 'manager', or 'volunteer')
 * @returns Promise resolving to success boolean
 */
export const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
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
 * @returns Promise resolving to void
 */
export const createUserRecord = async (user: User, role: UserRole = UserRole.VOLUNTEER): Promise<void> => {
  try {
    // First try the direct approach - this will work if RLS policies are correctly set up
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        user_role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email_notifications: true,
        unread_messages: 0
      });
    
    if (error) {
      console.warn('Could not create user record directly due to RLS. This is expected if policies are not yet applied.', error);
      console.info('User will be created by the database trigger when it is set up.');
      
      // Even if this fails, the database trigger will create the user when properly set up
      // We'll check if the user was created by the trigger after a short delay
      setTimeout(async () => {
        const { data, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (checkError) {
          console.warn('Could not verify if user was created by trigger:', checkError);
        } else if (data) {
          console.info('User was successfully created by the database trigger:', data);
        } else {
          console.warn('User was not created by the trigger. Please apply the SQL migration to your Supabase instance.');
        }
      }, 2000); // Wait 2 seconds to check if the trigger created the user
    } else {
      console.info('User record created successfully');
    }
  } catch (error) {
    console.error('Error creating user record:', error);
    // The database trigger will handle user creation when properly set up
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

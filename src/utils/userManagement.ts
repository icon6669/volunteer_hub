import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserRole } from '../types';

const validRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.VOLUNTEER];

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
    // Validate role
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid user role: ${role}`);
    }

    // First check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', checkError);
      throw checkError;
    }
    
    if (existingUser) {
      console.info('User record already exists:', existingUser);
      return;
    }

    // Check if this would be the first user (for OWNER role)
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking user count:', countError);
      throw countError;
    }

    // Ensure role is a valid UserRole enum value
    const finalRole = count === 0 ? UserRole.OWNER : role;
    console.info('Creating user with role:', finalRole);

    // Create the user record
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        user_role: finalRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email_notifications: true,
        unread_messages: 0
      });
    
    if (insertError) {
      console.error('Error creating user record:', insertError);
      throw insertError;
    }
    
    console.info('User record created successfully with role:', finalRole);
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    throw error;
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

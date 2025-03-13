// Script to create an initial user in Supabase
// This will create a user with email kevin@kevinjemison.com and password password123

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Get Supabase credentials from environment variables
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseServiceKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createInitialUser() {
  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'kevin@kevinjemison.com')
      .limit(1);

    if (checkError) {
      throw new Error(`Error checking for existing user: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(`User already exists with ID: ${existingUsers[0].id}`);
      return;
    }

    // Create the user in auth.users
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: 'kevin@kevinjemison.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: 'Kevin Jemison'
      }
    });

    if (signUpError) {
      throw new Error(`Error creating auth user: ${signUpError.message}`);
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Create the user in public.users with owner role
    // This should be handled by a trigger, but we'll do it explicitly to be sure
    const { data: publicUser, error: insertError } = await supabase
      .from('users')
      .upsert({
        id: authUser.user.id,
        name: 'Kevin Jemison',
        email: 'kevin@kevinjemison.com',
        user_role: 'owner',
        email_notifications: true,
        unread_messages: 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select();

    if (insertError) {
      throw new Error(`Error creating public user: ${insertError.message}`);
    }

    console.log('Public user created successfully with owner role');
    console.log('Initial user creation complete!');
  } catch (error) {
    console.error('Error creating initial user:', error.message);
    process.exit(1);
  }
}

createInitialUser();

-- Reset database and create initial owner user
-- This migration will:
-- 1. Drop all existing data from tables
-- 2. Create a new owner user with email kevin@kevinjemison.com
-- 3. Set up all necessary RLS policies

-- First, disable RLS temporarily to allow for data deletion
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;

-- Truncate all tables to remove existing data
TRUNCATE TABLE IF EXISTS public.messages CASCADE;
TRUNCATE TABLE IF EXISTS public.volunteers CASCADE;
TRUNCATE TABLE IF EXISTS public.roles CASCADE;
TRUNCATE TABLE IF EXISTS public.events CASCADE;
TRUNCATE TABLE IF EXISTS public.system_settings CASCADE;
TRUNCATE TABLE IF EXISTS public.users CASCADE;

-- Delete all users from auth.users (requires superuser privileges)
-- This will be executed by Supabase when running migrations
DELETE FROM auth.users;

-- Create initial system settings
INSERT INTO public.system_settings (
  id, 
  key, 
  value, 
  organization_name,
  primary_color,
  allow_public_event_viewing,
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(), 
  'settings', 
  '{}', 
  'Volunteer Hub',
  '#3B82F6',
  true,
  NOW(), 
  NOW()
);

-- Re-enable RLS for all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Users table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view other users') THEN
        DROP POLICY "Users can view other users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow users to update own data') THEN
        DROP POLICY "Allow users to update own data" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Owners can update any user') THEN
        DROP POLICY "Owners can update any user" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow insert for authenticated users') THEN
        DROP POLICY "Allow insert for authenticated users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can manage all users') THEN
        DROP POLICY "Service role can manage all users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow first user to be owner') THEN
        DROP POLICY "Allow first user to be owner" ON users;
    END IF;
    
    -- Events table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can view events') THEN
        DROP POLICY "Users can view events" ON events;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Managers can create and update events') THEN
        DROP POLICY "Managers can create and update events" ON events;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Anonymous users can view events') THEN
        DROP POLICY "Anonymous users can view events" ON events;
    END IF;
    
    -- Roles table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Users can view roles') THEN
        DROP POLICY "Users can view roles" ON roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Managers can create and update roles') THEN
        DROP POLICY "Managers can create and update roles" ON roles;
    END IF;
    
    -- Volunteers table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Users can view volunteers') THEN
        DROP POLICY "Users can view volunteers" ON volunteers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Users can sign up as volunteers') THEN
        DROP POLICY "Users can sign up as volunteers" ON volunteers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Managers can update volunteers') THEN
        DROP POLICY "Managers can update volunteers" ON volunteers;
    END IF;
    
    -- Messages table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view their messages') THEN
        DROP POLICY "Users can view their messages" ON messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages') THEN
        DROP POLICY "Users can send messages" ON messages;
    END IF;
    
    -- System settings table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Users can view system settings') THEN
        DROP POLICY "Users can view system settings" ON system_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Owners can update system settings') THEN
        DROP POLICY "Owners can update system settings" ON system_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Service role can manage system settings') THEN
        DROP POLICY "Service role can manage system settings" ON system_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Anonymous users can view system settings') THEN
        DROP POLICY "Anonymous users can view system settings" ON system_settings;
    END IF;
END $$;

-- Create RLS policies for users table
CREATE POLICY "Users can view other users" ON users
    FOR SELECT
    USING (true);

CREATE POLICY "Allow users to update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Owners can update any user" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND user_role = 'OWNER'
        )
    );

CREATE POLICY "Allow insert for authenticated users" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow first user to be owner" ON users
    FOR INSERT
    WITH CHECK (
        NOT EXISTS (SELECT 1 FROM users) -- Only applies when no users exist
    );

-- Create RLS policies for events table
CREATE POLICY "Users can view events" ON events
    FOR SELECT
    USING (true);

CREATE POLICY "Anonymous users can view events" ON events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM system_settings
            WHERE key = 'settings' AND (value::json->>'allow_public_event_viewing')::boolean = true
        )
    );

CREATE POLICY "Managers can create and update events" ON events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (user_role = 'MANAGER' OR user_role = 'OWNER')
        )
    );

-- Create RLS policies for roles table
CREATE POLICY "Users can view roles" ON roles
    FOR SELECT
    USING (true);

CREATE POLICY "Managers can create and update roles" ON roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (user_role = 'MANAGER' OR user_role = 'OWNER')
        )
    );

-- Create RLS policies for volunteers table
CREATE POLICY "Users can view volunteers" ON volunteers
    FOR SELECT
    USING (true);

CREATE POLICY "Users can sign up as volunteers" ON volunteers
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can update volunteers" ON volunteers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (user_role = 'MANAGER' OR user_role = 'OWNER')
        )
    );

-- Create RLS policies for messages table
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT
    USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
    );

-- Create RLS policies for system_settings table
CREATE POLICY "Users can view system settings" ON system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Anonymous users can view system settings" ON system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Owners can update system settings" ON system_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND user_role = 'OWNER'
        )
    );

CREATE POLICY "Service role can manage system settings" ON system_settings
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a function to create the initial owner user
-- This function will be called by the application when it starts
CREATE OR REPLACE FUNCTION create_initial_owner_user()
RETURNS void AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if users table is empty
    IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
        -- Create the user in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'kevin@kevinjemison.com',
            crypt('password123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Kevin Jemison"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO new_user_id;
        
        -- Insert into public.users table with owner role
        INSERT INTO public.users (
            id,
            name,
            email,
            user_role,
            email_notifications,
            unread_messages,
            created_at,
            updated_at
        )
        VALUES (
            new_user_id,
            'Kevin Jemison',
            'kevin@kevinjemison.com',
            'OWNER',
            true,
            0,
            now(),
            now()
        );
        
        RAISE NOTICE 'Created initial owner user with ID: %', new_user_id;
    ELSE
        RAISE NOTICE 'Users already exist, skipping initial user creation';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the initial owner user
SELECT create_initial_owner_user();

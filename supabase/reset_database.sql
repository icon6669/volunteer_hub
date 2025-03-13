-- Reset database and create initial owner user
-- This script will:
-- 1. Drop all existing data from tables
-- 2. Create a new owner user with email kevin@kevinjemison.com
-- 3. Set up all necessary RLS policies

-- First, disable RLS temporarily to allow for data deletion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;

-- Truncate all tables to remove existing data
DO $$
BEGIN
    -- Use EXECUTE to handle the case where tables might not exist
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.messages CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.messages does not exist, skipping';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.volunteers CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.volunteers does not exist, skipping';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.roles CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.roles does not exist, skipping';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.events CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.events does not exist, skipping';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.system_settings CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.system_settings does not exist, skipping';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.users CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.users does not exist, skipping';
    END;
END $$;

-- Delete all users from auth.users
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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Users table policies
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view other users" ON users';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update own data" ON users';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update any user" ON users';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage all users" ON users';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Allow first user to be owner" ON users';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    -- Events table policies
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view events" ON events';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Managers can create and update events" ON events';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Anonymous users can view events" ON events';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    -- Roles table policies
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view roles" ON roles';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Managers can create and update roles" ON roles';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    -- Volunteers table policies
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view volunteers" ON volunteers';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can sign up as volunteers" ON volunteers';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Managers can update volunteers" ON volunteers';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    -- Messages table policies
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their messages" ON messages';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can send messages" ON messages';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    -- System settings table policies
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view system settings" ON system_settings';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update system settings" ON system_settings';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage system settings" ON system_settings';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Anonymous users can view system settings" ON system_settings';
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
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
            WHERE id = auth.uid() AND user_role = 'owner'
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
            WHERE id = auth.uid() AND (user_role = 'manager' OR user_role = 'owner' OR user_role = 'admin')
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
            WHERE id = auth.uid() AND (user_role = 'manager' OR user_role = 'owner' OR user_role = 'admin')
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
            WHERE id = auth.uid() AND (user_role = 'manager' OR user_role = 'owner' OR user_role = 'admin')
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
            WHERE id = auth.uid() AND user_role = 'owner'
        )
    );

CREATE POLICY "Service role can manage system settings" ON system_settings
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create the initial owner user
DO $$
DECLARE
    new_user_id UUID;
BEGIN
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
        'owner',
        true,
        0,
        now(),
        now()
    );
    
    RAISE NOTICE 'Created initial owner user with ID: %', new_user_id;
END $$;

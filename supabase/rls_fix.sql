-- Fix RLS policies for the users table to allow proper authentication and authorization

-- First, check if the policy already exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow insert for authenticated users') THEN
        DROP POLICY "Allow insert for authenticated users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can manage all users') THEN
        DROP POLICY "Service role can manage all users" ON users;
    END IF;
END $$;

-- Create policy to allow authenticated users to insert their own record
CREATE POLICY "Allow insert for authenticated users" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policy to allow service role to bypass RLS for all operations
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policy to allow the first user to be created as owner
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow first user to be owner') THEN
        CREATE POLICY "Allow first user to be owner" ON users
            FOR INSERT
            WITH CHECK (
                NOT EXISTS (SELECT 1 FROM users) -- Only applies when no users exist
            );
    END IF;
END $$;

-- Fix RLS policies for the system_settings table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Service role can manage system settings') THEN
        CREATE POLICY "Service role can manage system settings" ON system_settings
            FOR ALL
            USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- Ensure anonymous users can read necessary data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Anonymous users can view system settings') THEN
        CREATE POLICY "Anonymous users can view system settings" ON system_settings
            FOR SELECT
            USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Anonymous users can view events') THEN
        CREATE POLICY "Anonymous users can view events" ON events
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM system_settings
                    WHERE key = 'settings' AND (value::json->>'allow_public_event_viewing')::boolean = true
                )
            );
    END IF;
END $$;

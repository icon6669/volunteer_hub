-- Fix RLS policies for the users table to allow proper authentication and authorization

-- This migration adds the missing RLS policies needed for proper user authentication
-- It's designed to be idempotent (can be run multiple times without error)

-- First, check if policies exist and drop them if they do (to avoid conflicts)
DO $$
BEGIN
    -- Users table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow insert for authenticated users') THEN
        DROP POLICY "Allow insert for authenticated users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can manage all users') THEN
        DROP POLICY "Service role can manage all users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow first user to be owner') THEN
        DROP POLICY "Allow first user to be owner" ON users;
    END IF;
    
    -- System settings table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Service role can manage system settings') THEN
        DROP POLICY "Service role can manage system settings" ON system_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Anonymous users can view system settings') THEN
        DROP POLICY "Anonymous users can view system settings" ON system_settings;
    END IF;
    
    -- Events table anonymous policy
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Anonymous users can view events') THEN
        DROP POLICY "Anonymous users can view events" ON events;
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
CREATE POLICY "Allow first user to be owner" ON users
    FOR INSERT
    WITH CHECK (
        NOT EXISTS (SELECT 1 FROM users) -- Only applies when no users exist
    );

-- Fix RLS policies for the system_settings table
CREATE POLICY "Service role can manage system settings" ON system_settings
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Ensure anonymous users can read necessary data
CREATE POLICY "Anonymous users can view system settings" ON system_settings
    FOR SELECT
    USING (true);

-- Allow anonymous users to view events if public viewing is enabled
CREATE POLICY "Anonymous users can view events" ON events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM system_settings
            WHERE key = 'settings' AND (value::json->>'allow_public_event_viewing')::boolean = true
        )
    );

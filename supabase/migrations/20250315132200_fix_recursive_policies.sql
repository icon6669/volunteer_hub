-- Migration to fix infinite recursion in RLS policies
-- This migration will:
-- 1. Drop all existing policies that are causing recursion
-- 2. Create new policies that avoid circular references
-- 3. Use a more direct approach for role-based access control

-- First, drop all existing policies
DO $$
BEGIN
    -- Drop policies for users table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users') THEN
        DROP POLICY IF EXISTS "Users can view and update own data" ON users;
        DROP POLICY IF EXISTS "Owners can manage any user" ON users;
        DROP POLICY IF EXISTS "Owners can update any user" ON users;
        DROP POLICY IF EXISTS "Owners can delete users" ON users;
        DROP POLICY IF EXISTS "Users can view other users" ON users;
    END IF;
    
    -- Drop policies for events table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events') THEN
        DROP POLICY IF EXISTS "Anyone can view events" ON events;
        DROP POLICY IF EXISTS "Owners can manage all events" ON events;
        DROP POLICY IF EXISTS "Managers can manage their events" ON events;
        DROP POLICY IF EXISTS "Managers can create and update events" ON events;
        DROP POLICY IF EXISTS "Owners can delete events" ON events;
    END IF;
    
    -- Drop policies for roles table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles') THEN
        DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
        DROP POLICY IF EXISTS "Owners can manage all roles" ON roles;
        DROP POLICY IF EXISTS "Managers can manage roles for their events" ON roles;
        DROP POLICY IF EXISTS "Managers can create and update roles" ON roles;
    END IF;
    
    -- Drop policies for volunteers table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers') THEN
        DROP POLICY IF EXISTS "Anyone can view volunteers" ON volunteers;
        DROP POLICY IF EXISTS "Users can volunteer" ON volunteers;
        DROP POLICY IF EXISTS "Owners can manage all volunteers" ON volunteers;
        DROP POLICY IF EXISTS "Managers can manage volunteers for their events" ON volunteers;
        DROP POLICY IF EXISTS "Managers can update volunteers" ON volunteers;
    END IF;
    
    -- Drop policies for messages table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages') THEN
        DROP POLICY IF EXISTS "Users can view their messages" ON messages;
        DROP POLICY IF EXISTS "Users can send messages" ON messages;
        DROP POLICY IF EXISTS "Owners can manage all messages" ON messages;
    END IF;
    
    -- Drop policies for system_settings table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings') THEN
        DROP POLICY IF EXISTS "Anyone can view system settings" ON system_settings;
        DROP POLICY IF EXISTS "Owners can update system settings" ON system_settings;
    END IF;
END $$;

-- Create a secure function to check user roles without recursion
CREATE OR REPLACE FUNCTION auth_is_role(required_role text)
RETURNS boolean AS $$
BEGIN
    -- Direct query to check role without using RLS
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users
        JOIN public.users ON auth.users.id = public.users.id
        WHERE auth.users.id = auth.uid() 
        AND public.users.user_role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to check if user is owner or manager
CREATE OR REPLACE FUNCTION auth_is_owner_or_manager()
RETURNS boolean AS $$
BEGIN
    -- Direct query to check if user is owner or manager
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users
        JOIN public.users ON auth.users.id = public.users.id
        WHERE auth.users.id = auth.uid() 
        AND (public.users.user_role = 'OWNER' OR public.users.user_role = 'MANAGER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to check if user is event owner
CREATE OR REPLACE FUNCTION auth_is_event_owner(event_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Direct query to check if user is event owner
    RETURN EXISTS (
        SELECT 1 
        FROM events
        WHERE events.id = event_id 
        AND events.owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies for users table
CREATE POLICY "Users can view and update own data" ON users
    FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view other users" ON users
    FOR SELECT
    USING (true);

CREATE POLICY "Owners can manage any user" ON users
    FOR ALL
    USING (auth_is_role('OWNER'))
    WITH CHECK (auth_is_role('OWNER'));

-- Create new policies for events table
CREATE POLICY "Anyone can view events" ON events
    FOR SELECT
    USING (true);

CREATE POLICY "Owners can manage all events" ON events
    FOR ALL
    USING (auth_is_role('OWNER'))
    WITH CHECK (auth_is_role('OWNER'));

CREATE POLICY "Managers can manage their events" ON events
    FOR ALL
    USING (auth_is_role('MANAGER') AND owner_id = auth.uid())
    WITH CHECK (auth_is_role('MANAGER') AND owner_id = auth.uid());

-- Create new policies for roles table
CREATE POLICY "Anyone can view roles" ON roles
    FOR SELECT
    USING (true);

CREATE POLICY "Owners can manage all roles" ON roles
    FOR ALL
    USING (auth_is_role('OWNER'))
    WITH CHECK (auth_is_role('OWNER'));

CREATE POLICY "Managers can manage roles for their events" ON roles
    FOR ALL
    USING (
        auth_is_role('MANAGER') AND
        auth_is_event_owner(event_id)
    )
    WITH CHECK (
        auth_is_role('MANAGER') AND
        auth_is_event_owner(event_id)
    );

-- Create new policies for volunteers table
CREATE POLICY "Anyone can view volunteers" ON volunteers
    FOR SELECT
    USING (true);

CREATE POLICY "Users can volunteer" ON volunteers
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own volunteer records" ON volunteers
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can manage all volunteers" ON volunteers
    FOR ALL
    USING (auth_is_role('OWNER'))
    WITH CHECK (auth_is_role('OWNER'));

CREATE POLICY "Managers can manage volunteers for their events" ON volunteers
    FOR ALL
    USING (
        auth_is_role('MANAGER') AND
        EXISTS (
            SELECT 1 FROM roles
            JOIN events ON roles.event_id = events.id
            WHERE roles.id = volunteers.role_id AND events.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        auth_is_role('MANAGER') AND
        EXISTS (
            SELECT 1 FROM roles
            JOIN events ON roles.event_id = events.id
            WHERE roles.id = volunteers.role_id AND events.owner_id = auth.uid()
        )
    );

-- Create new policies for messages table
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT
    USING (
        sender_id = auth.uid() OR
        recipient_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM volunteers
            WHERE volunteers.user_id = auth.uid() AND
            EXISTS (
                SELECT 1 FROM roles
                WHERE roles.id = volunteers.role_id AND
                roles.event_id = messages.event_id
            )
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Owners can manage all messages" ON messages
    FOR ALL
    USING (auth_is_role('OWNER'))
    WITH CHECK (auth_is_role('OWNER'));

-- Create new policies for system_settings table
CREATE POLICY "Anyone can view system settings" ON system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Owners can update system settings" ON system_settings
    FOR ALL
    USING (auth_is_role('OWNER'))
    WITH CHECK (auth_is_role('OWNER'));

-- Update the clear_database_data function to use the new auth_is_role function
CREATE OR REPLACE FUNCTION clear_database_data()
RETURNS void AS $$
BEGIN
    -- Check if the current user is an OWNER using our secure function
    IF auth_is_role('OWNER') THEN
        -- Clear data from all tables
        DELETE FROM messages;
        DELETE FROM volunteers;
        DELETE FROM roles;
        DELETE FROM events;
        -- Don't delete users to maintain the OWNER account
        
        RAISE NOTICE 'Database data cleared successfully by OWNER';
    ELSE
        RAISE EXCEPTION 'Only users with OWNER role can clear database data';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the functions to authenticated users
GRANT EXECUTE ON FUNCTION auth_is_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_owner_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_event_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_database_data() TO authenticated;

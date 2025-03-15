-- Migration to update OWNER permissions
-- This migration will:
-- 1. Update RLS policies to give OWNER full permissions to manage all aspects of the application
-- 2. Allow OWNER to create, change, and delete all events
-- 3. Allow OWNER to delete and create users
-- 4. Allow OWNER to clear data from the database

-- First, drop existing policies that need to be updated
DO $$
BEGIN
    -- Drop existing policies for users table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Owners can update any user') THEN
        DROP POLICY "Owners can update any user" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Owners can delete users') THEN
        DROP POLICY "Owners can delete users" ON users;
    END IF;
    
    -- Drop existing policies for events table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Managers can create and update events') THEN
        DROP POLICY "Managers can create and update events" ON events;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Owners can delete events') THEN
        DROP POLICY "Owners can delete events" ON events;
    END IF;
    
    -- Drop existing policies for roles table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Managers can create and update roles') THEN
        DROP POLICY "Managers can create and update roles" ON roles;
    END IF;
    
    -- Drop existing policies for volunteers table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Managers can update volunteers') THEN
        DROP POLICY "Managers can update volunteers" ON volunteers;
    END IF;
    
    -- Drop existing policies for messages table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages') THEN
        DROP POLICY "Users can send messages" ON messages;
    END IF;
END $$;

-- Create updated policies for users table
CREATE POLICY "Owners can manage any user" ON users
    FOR ALL
    USING (
        (auth.uid() = id) OR -- Users can always access their own record
        (
            -- Check if the current user is an OWNER using a direct comparison
            -- This avoids the recursion by not using EXISTS with a subquery
            auth.uid() IN (
                SELECT id FROM users 
                WHERE user_role = 'OWNER'
            )
        )
    );

-- Create updated policies for events table
CREATE POLICY "Owners can manage all events" ON events
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE user_role = 'OWNER'
        )
    );

CREATE POLICY "Managers can manage their events" ON events
    FOR ALL
    USING (
        (
            auth.uid() IN (
                SELECT id FROM users 
                WHERE user_role = 'MANAGER'
            )
        ) AND owner_id = auth.uid()
    );

-- Create updated policies for roles table
CREATE POLICY "Owners can manage all roles" ON roles
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE user_role = 'OWNER'
        )
    );

CREATE POLICY "Managers can manage roles for their events" ON roles
    FOR ALL
    USING (
        (
            auth.uid() IN (
                SELECT id FROM users 
                WHERE user_role = 'MANAGER'
            )
        ) AND
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = roles.event_id AND events.owner_id = auth.uid()
        )
    );

-- Create updated policies for volunteers table
CREATE POLICY "Owners can manage all volunteers" ON volunteers
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE user_role = 'OWNER'
        )
    );

CREATE POLICY "Managers can manage volunteers for their events" ON volunteers
    FOR ALL
    USING (
        (
            auth.uid() IN (
                SELECT id FROM users 
                WHERE user_role = 'MANAGER'
            )
        ) AND
        EXISTS (
            SELECT 1 FROM roles
            JOIN events ON roles.event_id = events.id
            WHERE roles.id = volunteers.role_id AND events.owner_id = auth.uid()
        )
    );

-- Create updated policies for messages table
CREATE POLICY "Owners can manage all messages" ON messages
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE user_role = 'OWNER'
        )
    );

-- Create a function to allow owners to clear data from the database
CREATE OR REPLACE FUNCTION clear_database_data()
RETURNS void AS $$
BEGIN
    -- Check if the current user is an OWNER using a direct comparison
    IF auth.uid() IN (
        SELECT id FROM users 
        WHERE user_role = 'OWNER'
    ) THEN
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

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION clear_database_data() TO authenticated;

-- Fix for policy already exists error
-- This migration will drop existing policies before recreating them

-- Function to safely drop and recreate policies for events table
CREATE OR REPLACE FUNCTION safe_recreate_events_policies() RETURNS void AS $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Owners can update their events" ON events;
    DROP POLICY IF EXISTS "Users can view all events" ON events;
    DROP POLICY IF EXISTS "Owners can insert events" ON events;
    DROP POLICY IF EXISTS "Owners can delete their events" ON events;
    DROP POLICY IF EXISTS "Anonymous users can view events" ON events;
    DROP POLICY IF EXISTS "Managers can create and update events" ON events;
    
    -- Create policies for events table
    CREATE POLICY "Users can view all events" ON events
        FOR SELECT
        USING (true);
        
    CREATE POLICY "Owners can insert events" ON events
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
        
    CREATE POLICY "Owners can update their events" ON events
        FOR UPDATE
        USING (
            owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
        
    CREATE POLICY "Owners can delete their events" ON events
        FOR DELETE
        USING (
            owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
        
    CREATE POLICY "Anonymous users can view events" ON events
        FOR SELECT
        USING (true);
        
    CREATE POLICY "Managers can create and update events" ON events
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid() AND (user_role = 'MANAGER' OR user_role = 'OWNER')
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Function to safely drop and recreate policies for roles table
CREATE OR REPLACE FUNCTION safe_recreate_roles_policies() RETURNS void AS $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
    DROP POLICY IF EXISTS "Event owners can insert roles" ON roles;
    DROP POLICY IF EXISTS "Event owners can update roles" ON roles;
    DROP POLICY IF EXISTS "Event owners can delete roles" ON roles;
    
    -- Create policies for roles table
    CREATE POLICY "Anyone can view roles" ON roles
        FOR SELECT
        USING (true);
        
    CREATE POLICY "Event owners can insert roles" ON roles
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_id AND events.owner_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
        
    CREATE POLICY "Event owners can update roles" ON roles
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_id AND events.owner_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
        
    CREATE POLICY "Event owners can delete roles" ON roles
        FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_id AND events.owner_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Function to safely drop and recreate policies for volunteers table
CREATE OR REPLACE FUNCTION safe_recreate_volunteers_policies() RETURNS void AS $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view volunteers" ON volunteers;
    DROP POLICY IF EXISTS "Authenticated users can insert volunteers" ON volunteers;
    DROP POLICY IF EXISTS "Users can update their own volunteer records" ON volunteers;
    DROP POLICY IF EXISTS "Users can delete their own volunteer records" ON volunteers;
    
    -- Create policies for volunteers table
    CREATE POLICY "Anyone can view volunteers" ON volunteers
        FOR SELECT
        USING (true);
        
    CREATE POLICY "Authenticated users can insert volunteers" ON volunteers
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Users can update their own volunteer records" ON volunteers
        FOR UPDATE
        USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
        
    CREATE POLICY "Users can delete their own volunteer records" ON volunteers
        FOR DELETE
        USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Function to safely drop and recreate policies for messages table
CREATE OR REPLACE FUNCTION safe_recreate_messages_policies() RETURNS void AS $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their messages" ON messages;
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    
    -- Create policies for messages table
    CREATE POLICY "Users can view their messages" ON messages
        FOR SELECT
        USING (
            sender_id = auth.uid() OR
            recipient_id = auth.uid() OR
            recipient_id IS NULL
        );
        
    CREATE POLICY "Users can send messages" ON messages
        FOR INSERT
        WITH CHECK (
            sender_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.user_role = 'owner'
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Function to safely drop and recreate policies for system_settings table
CREATE OR REPLACE FUNCTION safe_recreate_system_settings_policies() RETURNS void AS $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view system settings" ON system_settings;
    DROP POLICY IF EXISTS "Anonymous users can view system settings" ON system_settings;
    DROP POLICY IF EXISTS "Owners can update system settings" ON system_settings;
    DROP POLICY IF EXISTS "Service role can manage system settings" ON system_settings;
    
    -- Create policies for system_settings table
    CREATE POLICY "Users can view system settings" ON system_settings
        FOR SELECT
        USING (auth.role() = 'authenticated');
        
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
END;
$$ LANGUAGE plpgsql;

-- Function to safely drop and recreate policies for users table
CREATE OR REPLACE FUNCTION safe_recreate_users_policies() RETURNS void AS $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view other users" ON users;
    DROP POLICY IF EXISTS "Allow users to update own data" ON users;
    DROP POLICY IF EXISTS "Owners can update any user" ON users;
    DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
    DROP POLICY IF EXISTS "Service role can manage all users" ON users;
    DROP POLICY IF EXISTS "Allow first user to be owner" ON users;
    
    -- Create policies for users table
    CREATE POLICY "Users can view other users" ON users
        FOR SELECT
        USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Allow users to update own data" ON users
        FOR UPDATE
        USING (id = auth.uid());
        
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
        WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Service role can manage all users" ON users
        FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
        
    CREATE POLICY "Allow first user to be owner" ON users
        FOR INSERT
        WITH CHECK (
            NOT EXISTS (SELECT 1 FROM users WHERE user_role = 'owner')
        );
END;
$$ LANGUAGE plpgsql;

-- Execute the functions to recreate policies
DO $$
BEGIN
    -- Only run if the tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        PERFORM safe_recreate_events_policies();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        PERFORM safe_recreate_roles_policies();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volunteers') THEN
        PERFORM safe_recreate_volunteers_policies();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        PERFORM safe_recreate_messages_policies();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        PERFORM safe_recreate_system_settings_policies();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        PERFORM safe_recreate_users_policies();
    END IF;
END;
$$;

-- Drop the temporary functions
DROP FUNCTION IF EXISTS safe_recreate_events_policies();
DROP FUNCTION IF EXISTS safe_recreate_roles_policies();
DROP FUNCTION IF EXISTS safe_recreate_volunteers_policies();
DROP FUNCTION IF EXISTS safe_recreate_messages_policies();
DROP FUNCTION IF EXISTS safe_recreate_system_settings_policies();
DROP FUNCTION IF EXISTS safe_recreate_users_policies();

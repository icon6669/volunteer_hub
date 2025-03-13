-- Consolidated migration file
-- This migration will:
-- 1. Drop all existing data from tables
-- 2. Create a new owner user with email kevin@kevinjemison.com
-- 3. Set up all necessary RLS policies with correct column references and user roles

-- First, disable RLS temporarily to allow for data deletion
DO $$
BEGIN
    -- Disable RLS on tables if they exist
    BEGIN
        EXECUTE 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.events DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.volunteers DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Drop all existing policies before altering any columns
DO $$
BEGIN
    -- Drop all policies for users table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view other users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update own data" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow first user to be owner" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update any user" ON users';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Drop all policies for events table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can insert events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can update events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can delete events" ON events';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Drop all policies for roles table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view roles" ON roles';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can insert roles" ON roles';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can update roles" ON roles';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can delete roles" ON roles';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Drop all policies for volunteers table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all volunteers" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert volunteers" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own volunteer records" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own volunteer records" ON volunteers';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Drop all policies for messages table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their messages" ON messages';
        EXECUTE 'DROP POLICY IF EXISTS "Users can send messages" ON messages';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Drop all policies for system_settings table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view system settings" ON system_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Anonymous users can view system settings" ON system_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update system settings" ON system_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage system settings" ON system_settings';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Drop and recreate tables to ensure correct structure
DO $$
BEGIN
    -- Drop tables if they exist
    BEGIN
        EXECUTE 'DROP TABLE IF EXISTS public.volunteers CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP TABLE IF EXISTS public.roles CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP TABLE IF EXISTS public.messages CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP TABLE IF EXISTS public.events CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP TABLE IF EXISTS public.system_settings CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'DROP TABLE IF EXISTS public.users CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- Also truncate auth.users to completely reset the database
    BEGIN
        EXECUTE 'TRUNCATE TABLE auth.users CASCADE';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- Create users table with correct structure
    BEGIN
        EXECUTE $SQL$
            CREATE TABLE public.users (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                user_role TEXT NOT NULL DEFAULT 'VOLUNTEER' CHECK (user_role IN ('OWNER', 'MANAGER', 'VOLUNTEER')),
                email_notifications BOOLEAN DEFAULT TRUE,
                unread_messages INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        $SQL$;
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    -- Create events table
    BEGIN
        EXECUTE $SQL$
            CREATE TABLE public.events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                location TEXT,
                start_date TIMESTAMP WITH TIME ZONE,
                end_date TIMESTAMP WITH TIME ZONE,
                owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        $SQL$;
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    -- Create roles table
    BEGIN
        EXECUTE $SQL$
            CREATE TABLE public.roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
                slots INTEGER DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        $SQL$;
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    -- Create volunteers table
    BEGIN
        EXECUTE $SQL$
            CREATE TABLE public.volunteers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        $SQL$;
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    -- Create messages table
    BEGIN
        EXECUTE $SQL$
            CREATE TABLE public.messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT NOT NULL,
                sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        $SQL$;
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    -- Create system_settings table
    BEGIN
        EXECUTE $SQL$
            CREATE TABLE public.system_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        $SQL$;
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
END $$;

-- Enable RLS on all tables
DO $$
BEGIN
    -- Enable RLS on tables if they exist
    BEGIN
        EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create RLS policies for users table
DO $$
BEGIN
    -- First, drop all existing policies for the users table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view other users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update own data" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow first user to be owner" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update any user" ON users';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can view other users" ON users
                FOR SELECT
                USING (auth.jwt() ->> 'role' = 'authenticated');
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Allow users to update own data" ON users
                FOR UPDATE
                USING (id = auth.uid());
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Allow insert for authenticated users" ON users
                FOR INSERT
                WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Allow first user to be owner" ON users
                FOR INSERT
                WITH CHECK (
                    NOT EXISTS (SELECT 1 FROM users WHERE user_role = 'OWNER')
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Owners can update any user" ON users
                FOR UPDATE
                USING (
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create RLS policies for events table
DO $$
BEGIN
    -- First, drop all existing policies for the events table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can insert events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can update events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can delete events" ON events';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can view all events" ON events
                FOR SELECT
                USING (true);
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Owners can insert events" ON events
                FOR INSERT
                WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE id = auth.uid() AND (user_role = 'MANAGER' OR user_role = 'OWNER')
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Event owners can update events" ON events
                FOR UPDATE
                USING (
                    owner_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Event owners can delete events" ON events
                FOR DELETE
                USING (
                    owner_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create RLS policies for roles table
DO $$
BEGIN
    -- First, drop all existing policies for the roles table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view roles" ON roles';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can insert roles" ON roles';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can update roles" ON roles';
        EXECUTE 'DROP POLICY IF EXISTS "Event owners can delete roles" ON roles';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Anyone can view roles" ON roles
                FOR SELECT
                USING (true);
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Event owners can insert roles" ON roles
                FOR INSERT
                WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM events
                        WHERE events.id = event_id AND events.owner_id = auth.uid()
                    ) OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Event owners can update roles" ON roles
                FOR UPDATE
                USING (
                    EXISTS (
                        SELECT 1 FROM events
                        WHERE events.id = event_id AND events.owner_id = auth.uid()
                    ) OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Event owners can delete roles" ON roles
                FOR DELETE
                USING (
                    EXISTS (
                        SELECT 1 FROM events
                        WHERE events.id = event_id AND events.owner_id = auth.uid()
                    ) OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create RLS policies for volunteers table
DO $$
BEGIN
    -- First, drop all existing policies for the volunteers table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all volunteers" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert volunteers" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own volunteer records" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own volunteer records" ON volunteers';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can view all volunteers" ON volunteers
                FOR SELECT
                USING (true);
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Authenticated users can insert volunteers" ON volunteers
                FOR INSERT
                WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can update their own volunteer records" ON volunteers
                FOR UPDATE
                USING (
                    user_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM roles
                        JOIN events ON roles.event_id = events.id
                        WHERE roles.id = volunteers.role_id AND events.owner_id = auth.uid()
                    ) OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can delete their own volunteer records" ON volunteers
                FOR DELETE
                USING (
                    user_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM roles
                        JOIN events ON roles.event_id = events.id
                        WHERE roles.id = volunteers.role_id AND events.owner_id = auth.uid()
                    ) OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create RLS policies for messages table
DO $$
BEGIN
    -- First, drop all existing policies for the messages table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their messages" ON messages';
        EXECUTE 'DROP POLICY IF EXISTS "Users can send messages" ON messages';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can view their messages" ON messages
                FOR SELECT
                USING (
                    sender_id = auth.uid() OR
                    recipient_id = auth.uid() OR
                    recipient_id IS NULL OR
                    EXISTS (
                        SELECT 1 FROM events
                        WHERE events.id = event_id AND events.owner_id = auth.uid()
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can send messages" ON messages
                FOR INSERT
                WITH CHECK (
                    sender_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create RLS policies for system_settings table
DO $$
BEGIN
    -- First, drop all existing policies for the system_settings table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view system settings" ON system_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Anonymous users can view system settings" ON system_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update system settings" ON system_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage system settings" ON system_settings';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Users can view system settings" ON system_settings
                FOR SELECT
                USING (auth.jwt() ->> 'role' = 'authenticated');
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Anonymous users can view system settings" ON system_settings
                FOR SELECT
                USING (true);
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Owners can update system settings" ON system_settings
                FOR UPDATE
                USING (
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE id = auth.uid() AND user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Service role can manage system settings" ON system_settings
                FOR ALL
                USING (auth.jwt() ->> 'role' = 'service_role');
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Create a function to create the initial owner user
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

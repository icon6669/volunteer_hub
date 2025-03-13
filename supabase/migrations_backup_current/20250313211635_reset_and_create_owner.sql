-- Reset database and create initial owner user
-- This migration will:
-- 1. Drop all existing data from tables
-- 2. Create a new owner user with email kevin@kevinjemison.com
-- 3. Set up all necessary RLS policies

-- First, disable RLS temporarily to allow for data deletion
DO $$
BEGIN
    -- Disable RLS on tables if they exist
    BEGIN
        EXECUTE 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.users does not exist, skipping RLS disable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.events DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.events does not exist, skipping RLS disable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.roles does not exist, skipping RLS disable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.volunteers DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.volunteers does not exist, skipping RLS disable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.messages does not exist, skipping RLS disable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.system_settings does not exist, skipping RLS disable';
    END;
END $$;

-- Truncate all tables to remove existing data
DO $$
BEGIN
    -- Use EXECUTE to handle the case where tables might not exist
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.messages CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.messages does not exist, skipping truncate';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.volunteers CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.volunteers does not exist, skipping truncate';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.roles CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.roles does not exist, skipping truncate';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.events CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.events does not exist, skipping truncate';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.system_settings CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.system_settings does not exist, skipping truncate';
    END;
    
    BEGIN
        EXECUTE 'TRUNCATE TABLE public.users CASCADE';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.users does not exist, skipping truncate';
    END;
END $$;

-- Delete all users from auth.users
DELETE FROM auth.users;

-- Create initial system settings if the table exists
DO $$
BEGIN
    BEGIN
        EXECUTE $SQL$
            INSERT INTO public.system_settings (
              id, 
              key, 
              value, 
              created_at, 
              updated_at
            ) VALUES (
              gen_random_uuid(), 
              'app_settings', 
              '{"googleAuthEnabled": false, "googleClientId": "", "googleClientSecret": "", "facebookAuthEnabled": false, "facebookAppId": "", "facebookAppSecret": "", "emailAuthEnabled": true, "landingPageTheme": "light", "organizationName": "Volunteer Hub", "primaryColor": "#3B82F6", "organizationLogo": "", "allowPublicEventViewing": true}', 
              NOW(), 
              NOW()
            )
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.system_settings does not exist, skipping insert';
    END;
END $$;

-- Add missing columns to events table if it exists
DO $$
BEGIN
    BEGIN
        EXECUTE $SQL$
            ALTER TABLE public.events 
            ADD COLUMN IF NOT EXISTS date TEXT,
            ADD COLUMN IF NOT EXISTS landing_page_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS landing_page_title TEXT,
            ADD COLUMN IF NOT EXISTS landing_page_description TEXT,
            ADD COLUMN IF NOT EXISTS landing_page_image TEXT,
            ADD COLUMN IF NOT EXISTS landing_page_theme TEXT,
            ADD COLUMN IF NOT EXISTS custom_url TEXT;
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.events does not exist, skipping column addition';
    END;
END $$;

-- Add missing columns to messages table if it exists
DO $$
BEGIN
    BEGIN
        EXECUTE $SQL$
            ALTER TABLE public.messages 
            ADD COLUMN IF NOT EXISTS recipient_id UUID,
            ADD COLUMN IF NOT EXISTS subject TEXT,
            ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.messages does not exist, skipping column addition';
    END;
END $$;

-- Ensure messages table has recipient_id column
DO $$
BEGIN
    BEGIN
        EXECUTE $SQL$
            ALTER TABLE public.messages 
            ADD COLUMN IF NOT EXISTS recipient_id UUID;
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Fix column names in users table if it exists to match database schema types
DO $$
BEGIN
    BEGIN
        -- Check if the table exists first
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            -- Check and rename userrole to user_role if needed
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'userrole') 
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_role') THEN
                EXECUTE 'ALTER TABLE public.users RENAME COLUMN userrole TO user_role';
            END IF;

            -- Check and rename emailnotifications to email_notifications if needed
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailnotifications') 
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_notifications') THEN
                EXECUTE 'ALTER TABLE public.users RENAME COLUMN emailnotifications TO email_notifications';
            END IF;

            -- Check and rename unreadmessages to unread_messages if needed
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'unreadmessages') 
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'unread_messages') THEN
                EXECUTE 'ALTER TABLE public.users RENAME COLUMN unreadmessages TO unread_messages';
            END IF;

            -- Check and rename providerid to provider_id if needed
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'providerid') 
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'provider_id') THEN
                EXECUTE 'ALTER TABLE public.users RENAME COLUMN providerid TO provider_id';
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing column names in users table: %', SQLERRM;
    END;
END $$;

-- Re-enable RLS for all tables
DO $$
BEGIN
    -- Enable RLS on tables if they exist
    BEGIN
        EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.users does not exist, skipping RLS enable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.events does not exist, skipping RLS enable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.roles does not exist, skipping RLS enable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.volunteers does not exist, skipping RLS enable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.messages does not exist, skipping RLS enable';
    END;
    
    BEGIN
        EXECUTE 'ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table public.system_settings does not exist, skipping RLS enable';
    END;
END $$;

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
DO $$
BEGIN
    -- First, drop all existing policies for the users table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view other users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update own data" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update any user" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage all users" ON users';
        EXECUTE 'DROP POLICY IF EXISTS "Allow first user to be owner" ON users';
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
            CREATE POLICY "Owners can update any user" ON users
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
            CREATE POLICY "Allow insert for authenticated users" ON users
                FOR INSERT
                WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Service role can manage all users" ON users
                FOR ALL
                USING (auth.jwt() ->> 'role' = 'service_role');
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
END $$;

-- Create RLS policies for events table
DO $$
BEGIN
    -- First, drop all existing policies for the events table
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can insert events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can update their events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Owners can delete their events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Anonymous users can view events" ON events';
        EXECUTE 'DROP POLICY IF EXISTS "Managers can create and update events" ON events';
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
                        WHERE users.id = auth.uid() AND users.user_role = 'OWNER'
                    )
                );
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Owners can update their events" ON events
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
            CREATE POLICY "Owners can delete their events" ON events
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
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Anonymous users can view events" ON events
                FOR SELECT
                USING (true);
        $SQL$;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Managers can create and update events" ON events
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM users
                        WHERE id = auth.uid() AND (user_role = 'MANAGER' OR user_role = 'OWNER' OR user_role = 'ADMIN')
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
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view volunteers" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert volunteers" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own volunteer records" ON volunteers';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own volunteer records" ON volunteers';
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Then create new policies
    BEGIN
        EXECUTE $SQL$
            CREATE POLICY "Anyone can view volunteers" ON volunteers
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
-- Create or update all tables to ensure they have the correct structure
-- This ensures the database schema fully supports the application's functionality

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  image TEXT,
  user_role TEXT DEFAULT 'volunteer',
  email_notifications BOOLEAN DEFAULT true,
  unread_messages INTEGER DEFAULT 0,
  provider_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 0,
  max_capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volunteers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE,
  value TEXT,
  google_auth_enabled BOOLEAN DEFAULT FALSE,
  google_client_id TEXT DEFAULT '',
  google_client_secret TEXT DEFAULT '',
  facebook_auth_enabled BOOLEAN DEFAULT FALSE,
  facebook_app_id TEXT DEFAULT '',
  facebook_app_secret TEXT DEFAULT '',
  organization_name TEXT DEFAULT 'Volunteer Hub',
  organization_logo TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#3B82F6',
  allow_public_event_viewing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Add missing columns to the messages table if they don't exist
DO $$
BEGIN
    -- Add recipient_id column to messages table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN recipient_id UUID REFERENCES auth.users(id) NULL;
    END IF;

    -- Add subject column to messages table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'subject'
    ) THEN
        ALTER TABLE messages ADD COLUMN subject TEXT NULL;
    END IF;

    -- Add read column to messages table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'read'
    ) THEN
        ALTER TABLE messages ADD COLUMN read BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Update system_settings table structure to match application expectations
DO $$
BEGIN
    -- Check if system_settings table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'system_settings'
    ) THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'google_auth_enabled'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN google_auth_enabled BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'google_client_id'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN google_client_id TEXT DEFAULT '';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'google_client_secret'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN google_client_secret TEXT DEFAULT '';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'facebook_auth_enabled'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN facebook_auth_enabled BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'facebook_app_id'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN facebook_app_id TEXT DEFAULT '';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'facebook_app_secret'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN facebook_app_secret TEXT DEFAULT '';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'organization_name'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN organization_name TEXT DEFAULT 'Volunteer Hub';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'organization_logo'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN organization_logo TEXT DEFAULT '';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'primary_color'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN primary_color TEXT DEFAULT '#3B82F6';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings' AND column_name = 'allow_public_event_viewing'
        ) THEN
            ALTER TABLE system_settings ADD COLUMN allow_public_event_viewing BOOLEAN DEFAULT TRUE;
        END IF;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid errors on re-running)
DO $$
BEGIN
    -- Drop users table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
        DROP POLICY "Users can update their own data" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow users to update own data') THEN
        DROP POLICY "Allow users to update own data" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view other users') THEN
        DROP POLICY "Users can view other users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Owners can update any user') THEN
        DROP POLICY "Owners can update any user" ON users;
    END IF;
    
    -- Drop events table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can view events') THEN
        DROP POLICY "Users can view events" ON events;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Managers can create and update events') THEN
        DROP POLICY "Managers can create and update events" ON events;
    END IF;
    
    -- Drop roles table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Users can view roles') THEN
        DROP POLICY "Users can view roles" ON roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Managers can create and update roles') THEN
        DROP POLICY "Managers can create and update roles" ON roles;
    END IF;
    
    -- Drop volunteers table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Users can view volunteers') THEN
        DROP POLICY "Users can view volunteers" ON volunteers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Users can sign up as volunteers') THEN
        DROP POLICY "Users can sign up as volunteers" ON volunteers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Managers can update volunteers') THEN
        DROP POLICY "Managers can update volunteers" ON volunteers;
    END IF;
    
    -- Drop messages table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view their messages') THEN
        DROP POLICY "Users can view their messages" ON messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages') THEN
        DROP POLICY "Users can send messages" ON messages;
    END IF;
    
    -- Drop system_settings table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Users can view system settings') THEN
        DROP POLICY "Users can view system settings" ON system_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Owners can update system settings') THEN
        DROP POLICY "Owners can update system settings" ON system_settings;
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
            WHERE id = auth.uid() AND user_role = 'owner'
        )
    );

-- Create RLS policies for events table
CREATE POLICY "Users can view events" ON events
    FOR SELECT
    USING (true);

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
        sender_id = auth.uid() OR 
        recipient_id = auth.uid() OR
        recipient_id IS NULL OR
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = messages.event_id AND e.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM volunteers v
            JOIN roles r ON v.role_id = r.id
            WHERE v.user_id = auth.uid() AND r.event_id = messages.event_id
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their messages" ON messages
    FOR UPDATE
    USING (
        (sender_id = auth.uid()) OR
        (recipient_id = auth.uid())
    );

-- Create RLS policies for system_settings table
CREATE POLICY "Users can view system settings" ON system_settings
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

-- Create a function to automatically create user records
CREATE OR REPLACE FUNCTION create_user_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    user_metadata JSONB;
    user_name TEXT;
    is_first_user BOOLEAN;
BEGIN
    -- Get the user's metadata
    user_metadata := NEW.raw_user_meta_data;
    
    -- Extract the name from metadata or use email
    IF user_metadata ? 'name' THEN
        user_name := user_metadata->>'name';
    ELSE
        -- Use part before @ as name
        user_name := split_part(NEW.email, '@', 1);
    END IF;
    
    -- Check if this is the first user
    SELECT COUNT(*) INTO user_count FROM users;
    is_first_user := user_count = 0;
    
    -- Check if user_metadata contains is_first_user flag
    IF user_metadata ? 'is_first_user' THEN
        is_first_user := (user_metadata->>'is_first_user')::BOOLEAN OR is_first_user;
    END IF;
    
    -- Insert the user with appropriate role
    INSERT INTO users (
        id,
        email,
        user_role,
        name,
        email_notifications,
        unread_messages,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        CASE WHEN is_first_user THEN 'owner' ELSE 'volunteer' END,
        user_name,
        TRUE,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create user records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_on_signup();

-- Create a function to transfer ownership
CREATE OR REPLACE FUNCTION transfer_ownership(current_owner_id UUID, new_owner_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verify the current user is the owner
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = current_owner_id AND user_role = 'owner') THEN
        RAISE EXCEPTION 'Only the current owner can transfer ownership';
    END IF;
    
    -- Verify the new owner exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = new_owner_id) THEN
        RAISE EXCEPTION 'New owner does not exist';
    END IF;
    
    -- Start a transaction to ensure atomicity
    BEGIN
        -- Demote the current owner to manager
        UPDATE users
        SET user_role = 'manager',
            updated_at = NOW()
        WHERE id = current_owner_id;
        
        -- Promote the new user to owner
        UPDATE users
        SET user_role = 'owner',
            updated_at = NOW()
        WHERE id = new_owner_id;
        
        -- If any of the above operations fail, the entire transaction will be rolled back
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_user_role') THEN
        CREATE INDEX idx_users_user_role ON users(user_role);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_created_by') THEN
        CREATE INDEX idx_events_created_by ON events(created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_roles_event_id') THEN
        CREATE INDEX idx_roles_event_id ON roles(event_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_volunteers_user_id') THEN
        CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_volunteers_role_id') THEN
        CREATE INDEX idx_volunteers_role_id ON volunteers(role_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_sender_id') THEN
        CREATE INDEX idx_messages_sender_id ON messages(sender_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_recipient_id') THEN
        CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
    END IF;
END $$;

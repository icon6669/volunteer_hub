-- Initialize default values for existing tables
-- This script only adds data to tables that need it without creating any new tables or structures

-- Initialize system_settings with default values if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.system_settings LIMIT 1) THEN
        INSERT INTO public.system_settings (
            id, 
            key, 
            value, 
            created_at, 
            updated_at
        ) VALUES (
            uuid_generate_v4(), 
            'settings', 
            '{
                "google_auth_enabled": false,
                "google_client_id": "",
                "google_client_secret": "",
                "facebook_auth_enabled": false,
                "facebook_app_id": "",
                "facebook_app_secret": "",
                "organization_name": "Volunteer Hub",
                "organization_logo": "",
                "primary_color": "#3b82f6",
                "allow_public_event_viewing": true
            }',
            now(),
            now()
        );
        RAISE NOTICE 'Default system settings added.';
    ELSE
        RAISE NOTICE 'System settings already exist. No changes made.';
    END IF;
END
$$;

-- Create a default admin user if no admin exists
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    -- Check if an admin user already exists
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE user_role = 'admin' LIMIT 1
    ) INTO admin_exists;
    
    -- If no admin exists and the users table has data, promote the first user to admin
    IF NOT admin_exists AND EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
        UPDATE public.users
        SET user_role = 'admin'
        WHERE id = (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1);
        RAISE NOTICE 'First user promoted to admin.';
    ELSIF NOT admin_exists THEN
        RAISE NOTICE 'No users exist yet. First user will need to be promoted to admin manually.';
    ELSE
        RAISE NOTICE 'Admin user already exists. No changes made.';
    END IF;
END
$$;

-- Add a sample event if the events table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) AND EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
        INSERT INTO public.events (
            id,
            name,
            description,
            location,
            start_date,
            end_date,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'Welcome to Volunteer Hub',
            'This is a sample event to help you get started with Volunteer Hub. Feel free to edit or delete it.',
            'Virtual',
            now() + interval '7 days',
            now() + interval '7 days' + interval '2 hours',
            (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
            now(),
            now()
        );
        RAISE NOTICE 'Sample event added.';
    ELSE
        RAISE NOTICE 'Events already exist or no users available. No sample event added.';
    END IF;
END
$$;

-- Add a sample role to the sample event if roles table is empty
DO $$
DECLARE
    sample_event_id UUID;
BEGIN
    -- Get the sample event ID if it exists
    SELECT id INTO sample_event_id FROM public.events 
    WHERE name = 'Welcome to Volunteer Hub' LIMIT 1;
    
    IF sample_event_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.roles LIMIT 1) THEN
        INSERT INTO public.roles (
            id,
            event_id,
            name,
            description,
            capacity,
            max_capacity,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            sample_event_id,
            'Volunteer Coordinator',
            'Help coordinate other volunteers for this event.',
            0,
            5,
            now(),
            now()
        );
        RAISE NOTICE 'Sample role added.';
    ELSE
        RAISE NOTICE 'Roles already exist or no sample event available. No sample role added.';
    END IF;
END
$$;

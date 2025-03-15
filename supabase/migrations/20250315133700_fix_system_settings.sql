-- Migration to fix system_settings table and ensure proper initialization
-- This addresses the 406 error when trying to fetch system settings

-- First, check if the system_settings table exists and has the right structure
DO $$
BEGIN
    -- Create system_settings table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_settings') THEN
        CREATE TABLE system_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key TEXT UNIQUE NOT NULL,
            value JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable RLS on the table
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Anyone can view system settings" ON system_settings;
    DROP POLICY IF EXISTS "Owners can update system settings" ON system_settings;
    DROP POLICY IF EXISTS "Anonymous users can view system settings" ON system_settings;
    DROP POLICY IF EXISTS "Service role can manage system settings" ON system_settings;
    
    -- Create policies for system_settings
    CREATE POLICY "Anyone can view system settings" ON system_settings
        FOR SELECT
        USING (true);
        
    CREATE POLICY "Owners can update system settings" ON system_settings
        FOR ALL
        USING (auth_is_role('OWNER'))
        WITH CHECK (auth_is_role('OWNER'));
        
    -- Initialize system_settings with default values if not already present
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE key = 'settings') THEN
        INSERT INTO system_settings (
            key, 
            value, 
            created_at, 
            updated_at
        ) VALUES (
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
                "allow_public_event_viewing": true,
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
            }'::jsonb,
            now(),
            now()
        );
    END IF;
END $$;

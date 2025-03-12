-- Initialize system_settings table with default values
-- First check if there are any existing records
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.system_settings LIMIT 1) THEN
        -- Insert default settings
        INSERT INTO public.system_settings (
            id, 
            key, 
            value, 
            created_at, 
            updated_at
        ) VALUES (
            uuid_generate_v4(), 
            'default_settings', 
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
    END IF;
END
$$;

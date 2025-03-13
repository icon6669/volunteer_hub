-- Add initial user to auth.users and public.users tables
-- This will create a user with email kevin@kevinjemison.com and password password123

-- First, check if the user already exists to avoid duplicates
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = 'kevin@kevinjemison.com';
    
    -- If user doesn't exist, create the user
    IF user_id IS NULL THEN
        -- Insert into auth.users table
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
        RETURNING id INTO user_id;
        
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
            user_id,
            'Kevin Jemison',
            'kevin@kevinjemison.com',
            'owner',
            true,
            0,
            now(),
            now()
        );
        
        RAISE NOTICE 'User created with ID: %', user_id;
    ELSE
        RAISE NOTICE 'User already exists with ID: %', user_id;
    END IF;
END $$;

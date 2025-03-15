-- Migration to fix the user role permissions
-- This ensures that the auth_is_role function properly handles case sensitivity

-- Update the auth_is_role function to handle case sensitivity
CREATE OR REPLACE FUNCTION auth_is_role(required_role text)
RETURNS boolean AS $$
BEGIN
    -- Direct query to check role without using RLS
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users
        JOIN public.users ON auth.users.id = public.users.id
        WHERE auth.users.id = auth.uid() 
        AND UPPER(public.users.user_role) = UPPER(required_role)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auth_is_owner_or_manager function
CREATE OR REPLACE FUNCTION auth_is_owner_or_manager()
RETURNS boolean AS $$
BEGIN
    -- Direct query to check if user is owner or manager
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users
        JOIN public.users ON auth.users.id = public.users.id
        WHERE auth.users.id = auth.uid() 
        AND (UPPER(public.users.user_role) = 'OWNER' OR UPPER(public.users.user_role) = 'MANAGER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

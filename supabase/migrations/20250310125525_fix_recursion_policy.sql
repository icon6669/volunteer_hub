BEGIN;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Owners can manage all users" ON users;

-- Create a function to check if a user is an owner without recursion
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    JOIN users ON users.id = auth.users.id
    WHERE auth.users.id = auth.uid() AND users.userRole = 'OWNER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use the function instead of direct table access
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Owners can manage all users"
ON users
FOR ALL
USING (is_owner());

COMMIT;

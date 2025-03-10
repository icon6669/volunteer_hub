/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `image` (text)
      - `user_role` (text)
      - `email_notifications` (boolean)
      - `unread_messages` (integer)
      - `provider_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for owner to read all user data
    - Add policy for owner to update user roles
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  image text,
  user_role text NOT NULL DEFAULT 'volunteer',
  email_notifications boolean DEFAULT true,
  unread_messages integer DEFAULT 0,
  provider_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Owner can read all user data" ON users;
DROP POLICY IF EXISTS "Owner can update user roles" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create policy for reading own user data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR NOT EXISTS (SELECT 1 FROM users WHERE user_role = 'owner'));

-- Create policy for owner to read all user data
CREATE POLICY "Owner can read all user data"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND user_role = 'owner'
    ) OR
    NOT EXISTS (SELECT 1 FROM users WHERE user_role = 'owner')
  );

-- Create policy for owner to update user roles
CREATE POLICY "Owner can update user roles"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND user_role = 'owner'
    )
  )
  WITH CHECK (
    CASE
      WHEN (SELECT user_role FROM auth.users WHERE id = auth.uid()) = 'owner' THEN
        NOT EXISTS (
          SELECT 1 FROM users 
          WHERE user_role = 'owner' 
          AND id != NEW.id
        )
      ELSE
        TRUE
    END
  );

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for new user registration
CREATE POLICY "Allow new user registration"
  ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    (
      NOT EXISTS (SELECT 1 FROM users WHERE user_role = 'owner') OR
      (SELECT user_role FROM auth.users WHERE id = auth.uid()) = 'volunteer'
    )
  );

-- Create policy for owner to delete users
CREATE POLICY "Owner can delete users"
  ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND user_role = 'owner'
    ) AND
    id != auth.uid()
  );

-- Create trigger to update the updated_at column
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
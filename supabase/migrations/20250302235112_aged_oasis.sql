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

-- Create policy for reading own user data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy for owner to read all user data
CREATE POLICY "Owner can read all user data"
  ON users
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE user_role = 'owner'
  ));

-- Create policy for owner to update user roles
CREATE POLICY "Owner can update user roles"
  ON users
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE user_role = 'owner'
  ));

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to update the updated_at column
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
/*
  # Create roles table

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events.id)
      - `name` (text)
      - `description` (text)
      - `capacity` (integer)
      - `max_capacity` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `roles` table
    - Add policy for authenticated users to read roles
    - Add policy for managers to create/update/delete roles
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  capacity integer NOT NULL,
  max_capacity integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policy for reading roles (all authenticated users)
CREATE POLICY "Authenticated users can read roles"
  ON roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create policy for public role viewing (if enabled in system settings)
CREATE POLICY "Public can read roles if allowed"
  ON roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM system_settings 
      WHERE allow_public_event_viewing = true
    )
  );

-- Create policy for managers to create roles
CREATE POLICY "Managers can create roles"
  ON roles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE user_role IN ('manager', 'owner')
    )
  );

-- Create policy for managers to update roles
CREATE POLICY "Managers can update roles"
  ON roles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_role IN ('manager', 'owner')
    )
  );

-- Create policy for managers to delete roles
CREATE POLICY "Managers can delete roles"
  ON roles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_role IN ('manager', 'owner')
    )
  );

-- Create trigger to update the updated_at column
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
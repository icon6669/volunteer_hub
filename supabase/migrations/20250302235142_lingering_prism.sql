/*
  # Create volunteers table

  1. New Tables
    - `volunteers`
      - `id` (uuid, primary key)
      - `role_id` (uuid, references roles.id)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `description` (text)
      - `user_id` (uuid, references users.id)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `volunteers` table
    - Add policy for authenticated users to read volunteers
    - Add policy for authenticated users to create volunteers
    - Add policy for managers to read all volunteers
*/

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  description text,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Create policy for reading volunteers (all authenticated users)
CREATE POLICY "Authenticated users can read volunteers"
  ON volunteers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create policy for creating volunteers (all authenticated users)
CREATE POLICY "Authenticated users can create volunteers"
  ON volunteers
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for users to delete their own volunteer records
CREATE POLICY "Users can delete their own volunteer records"
  ON volunteers
  FOR DELETE
  USING (user_id = auth.uid());

-- Create policy for managers to delete any volunteer records
CREATE POLICY "Managers can delete any volunteer records"
  ON volunteers
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_role IN ('manager', 'owner')
    )
  );
/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `name` (text)
      - `date` (date)
      - `location` (text)
      - `description` (text)
      - `landing_page_enabled` (boolean)
      - `landing_page_title` (text)
      - `landing_page_description` (text)
      - `landing_page_image` (text)
      - `landing_page_theme` (text)
      - `created_by` (uuid, references users.id)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `events` table
    - Add policy for authenticated users to read events
    - Add policy for managers to create/update/delete events
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  date date NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  landing_page_enabled boolean DEFAULT false,
  landing_page_title text,
  landing_page_description text,
  landing_page_image text,
  landing_page_theme text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy for reading events (all authenticated users)
CREATE POLICY "Authenticated users can read events"
  ON events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create policy for public event viewing (if enabled in system settings)
CREATE POLICY "Public can read events if allowed"
  ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM system_settings 
      WHERE allow_public_event_viewing = true
    )
  );

-- Create policy for managers to create events
CREATE POLICY "Managers can create events"
  ON events
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE user_role IN ('manager', 'owner')
    )
  );

-- Create policy for managers to update their own events
CREATE POLICY "Managers can update their own events"
  ON events
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM users WHERE user_role = 'owner'
    )
  );

-- Create policy for managers to delete their own events
CREATE POLICY "Managers can delete their own events"
  ON events
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM users WHERE user_role = 'owner'
    )
  );

-- Create trigger to update the updated_at column
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
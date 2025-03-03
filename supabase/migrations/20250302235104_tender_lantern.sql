/*
  # Create system_settings table

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `google_auth_enabled` (boolean)
      - `google_client_id` (text)
      - `google_client_secret` (text)
      - `facebook_auth_enabled` (boolean)
      - `facebook_app_id` (text)
      - `facebook_app_secret` (text)
      - `organization_name` (text)
      - `organization_logo` (text)
      - `primary_color` (text)
      - `allow_public_event_viewing` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for authenticated users to read system settings
    - Add policy for owner to update system settings
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_auth_enabled boolean DEFAULT false,
  google_client_id text,
  google_client_secret text,
  facebook_auth_enabled boolean DEFAULT false,
  facebook_app_id text,
  facebook_app_secret text,
  organization_name text NOT NULL DEFAULT 'Volunteer Hub',
  organization_logo text,
  primary_color text DEFAULT '#0ea5e9',
  allow_public_event_viewing boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for reading system settings (all authenticated users)
CREATE POLICY "Anyone can read system settings"
  ON system_settings
  FOR SELECT
  USING (true);

-- Create policy for updating system settings (only owner)
CREATE POLICY "Only owner can update system settings"
  ON system_settings
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE user_role = 'owner'
  ));

-- Create policy for inserting system settings (only owner)
CREATE POLICY "Only owner can insert system settings"
  ON system_settings
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE user_role = 'owner'
  ));

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
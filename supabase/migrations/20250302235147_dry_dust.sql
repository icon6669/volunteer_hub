/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references users.id)
      - `recipient_id` (uuid, references users.id)
      - `subject` (text)
      - `content` (text)
      - `timestamp` (timestamp)
      - `read` (boolean)
  2. Security
    - Enable RLS on `messages` table
    - Add policy for users to read their own messages
    - Add policy for users to create messages
    - Add policy for users to delete their own messages
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  sender_id uuid REFERENCES users(id),
  recipient_id uuid REFERENCES users(id),
  subject text NOT NULL,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for reading own messages
CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  USING (
    recipient_id = auth.uid() OR
    sender_id = auth.uid()
  );

-- Create policy for creating messages
CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    auth.uid() IS NOT NULL
  );

-- Create policy for updating own received messages (marking as read)
CREATE POLICY "Users can update their received messages"
  ON messages
  FOR UPDATE
  USING (recipient_id = auth.uid());

-- Create policy for deleting own messages
CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  USING (
    recipient_id = auth.uid() OR
    sender_id = auth.uid()
  );
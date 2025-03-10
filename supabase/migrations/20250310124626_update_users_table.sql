BEGIN;

-- Rename columns to match TypeScript types
ALTER TABLE users RENAME COLUMN user_role TO userRole;
ALTER TABLE users RENAME COLUMN email_notifications TO emailNotifications;
ALTER TABLE users RENAME COLUMN unread_messages TO unreadMessages;
ALTER TABLE users RENAME COLUMN provider_id TO providerId;

-- Update data types if necessary
ALTER TABLE users ALTER COLUMN image TYPE varchar;

-- Add/update indexes
CREATE INDEX IF NOT EXISTS idx_users_userRole ON users(userRole);

-- Update RLS policies to use new column names
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Owners can manage all users"
ON users
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND userRole = 'OWNER'));

COMMIT;

-- Script to verify if the Supabase migration has been properly applied
-- This will check for the existence of key RLS policies and functions

-- Check for RLS policies on users table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Check for RLS policies on other tables
SELECT 
  tablename, 
  COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename IN ('events', 'roles', 'volunteers', 'messages', 'system_settings')
GROUP BY tablename
ORDER BY tablename;

-- Check if the create_user_on_signup function exists
SELECT 
  proname, 
  prosrc 
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
WHERE pg_proc.proname = 'create_user_on_signup'
AND pg_namespace.nspname = 'public';

-- Check if the transfer_ownership function exists
SELECT 
  proname, 
  prosrc 
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
WHERE pg_proc.proname = 'transfer_ownership'
AND pg_namespace.nspname = 'public';

-- Check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Check for indexes
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
AND tablename IN ('users', 'events', 'roles', 'volunteers', 'messages')
ORDER BY tablename, indexname;

-- Check if RLS is enabled on tables
SELECT 
  tablename, 
  relrowsecurity 
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE t.schemaname = 'public' 
AND t.tablename IN ('users', 'events', 'roles', 'volunteers', 'messages', 'system_settings')
ORDER BY tablename;

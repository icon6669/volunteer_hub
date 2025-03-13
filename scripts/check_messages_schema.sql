-- Check the current schema of the messages table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'messages'
ORDER BY 
  ordinal_position;

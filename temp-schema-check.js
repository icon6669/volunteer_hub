import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Using service role key for admin access

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Get list of tables
    console.log('Tables in public schema:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log(tables.map(t => t.table_name).join(', '));
    
    // Get table details
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\nTable: ${tableName}`);
      console.log('-'.repeat(tableName.length + 7));
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (columnsError) {
        console.error(`Error fetching columns for ${tableName}:`, columnsError);
        continue;
      }
      
      columns.forEach(col => {
        console.log(`${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
    }
    
    // Get RLS policies
    console.log('\nRow Level Security Policies:');
    console.log('-'.repeat(28));
    
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies');
    
    if (policiesError) {
      console.error('Error fetching RLS policies:', policiesError);
    } else {
      policies.forEach(policy => {
        console.log(`${policy.table}: ${policy.name} (${policy.action})`);
      });
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();

// Script to check the Supabase database schema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableInfo(tableName) {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: tableName });
  
  if (error) {
    console.error(`Error getting info for table ${tableName}:`, error);
    return null;
  }
  
  return data;
}

async function listTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('Error listing tables:', error);
    return [];
  }
  
  return data.map(t => t.table_name);
}

async function checkSchema() {
  try {
    console.log('Querying Supabase database schema...');
    
    // Get list of tables
    const tables = await listTables();
    console.log(`\nFound ${tables.length} tables in the public schema:`);
    console.log(tables.join(', '));
    
    // Create a custom query to get column information for each table
    for (const table of tables) {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table);
      
      if (error) {
        console.error(`Error getting columns for table ${table}:`, error);
        continue;
      }
      
      console.log(`\n\nTable: ${table}`);
      console.log('--------------------');
      data.forEach(col => {
        console.log(`${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
    }
    
    // Get RLS policies
    console.log('\n\nRow Level Security Policies:');
    console.log('-----------------------------');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*');
      
    if (policiesError) {
      console.error('Error getting RLS policies:', policiesError);
    } else if (policies) {
      policies.forEach(policy => {
        console.log(`${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();

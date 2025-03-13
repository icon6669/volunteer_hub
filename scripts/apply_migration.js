// Simple script to apply the migration SQL to Supabase
// This script uses the Supabase JS client to run the SQL

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  try {
    console.log('Reading migration SQL file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'complete_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration to Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error applying migration:', error);
      return false;
    }
    
    console.log('Migration applied successfully!');
    return true;
  } catch (err) {
    console.error('Unexpected error applying migration:', err);
    return false;
  }
}

// Main function to run the migration
async function main() {
  console.log('=== Applying Supabase Migration ===\n');
  
  const success = await applyMigration();
  
  if (success) {
    console.log('\n✅ Migration applied successfully! ✅');
    console.log('\nNext steps:');
    console.log('1. Rebuild and run the application');
    console.log('2. Test user signup and role management');
  } else {
    console.log('\n❌ Migration failed ❌');
    console.log('\nPlease check the error message above and fix the migration SQL file.');
    console.log('You may need to apply the migration manually in the Supabase dashboard:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of supabase/migrations/complete_migration.sql');
    console.log('4. Run the SQL commands');
  }
}

// Run the migration
main().catch(error => {
  console.error('Error running migration:', error);
});

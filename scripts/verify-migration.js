// Simple script to verify if the Supabase migration is working correctly
// This script uses the Supabase client directly without TypeScript

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user signup to verify the trigger is working
async function testUserSignup() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  console.log(`Creating test user: ${testEmail}`);
  
  try {
    // Sign up a test user
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          is_first_user: false
        }
      }
    });
    
    if (error) {
      console.error('Error signing up user:', error.message);
      return false;
    }
    
    if (!data.user) {
      console.error('No user returned from signup');
      return false;
    }
    
    console.log(`Auth user created successfully. User ID: ${data.user.id}`);
    
    // Wait a moment for the trigger to create the user
    console.log('Waiting for database trigger to create user record...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the user was created in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id);
    
    if (userError) {
      console.error('Error checking user record:', userError.message);
      return false;
    }
    
    if (!userData || userData.length === 0) {
      console.error('User record not found in database');
      console.error('This indicates that the trigger function is not working properly');
      return false;
    }
    
    console.log('User record created successfully in database:', userData[0]);
    return true;
  } catch (err) {
    console.error('Unexpected error during signup test:', err);
    return false;
  }
}

// Test direct access to users table to verify RLS policies
async function testRLSPolicies() {
  console.log('\nTesting RLS policies...');
  
  try {
    // Try to select all users (should work with proper RLS)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('Error selecting users:', usersError.message);
      console.error('This indicates that the RLS policies are not set up correctly');
      return false;
    }
    
    console.log(`Successfully retrieved ${users.length} users from database`);
    return true;
  } catch (err) {
    console.error('Unexpected error testing RLS policies:', err);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=== Verifying Supabase Migration ===\n');
  
  // Test user signup
  console.log('1. Testing user signup...');
  const signupSuccess = await testUserSignup();
  
  // Test RLS policies
  console.log('\n2. Testing RLS policies...');
  const rlsSuccess = await testRLSPolicies();
  
  // Summary
  console.log('\n=== Test Results ===');
  console.log(`User signup: ${signupSuccess ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  console.log(`RLS policies: ${rlsSuccess ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  
  if (signupSuccess && rlsSuccess) {
    console.log('\n✅ The Supabase migration is working correctly! ✅');
  } else {
    console.log('\n❌ The Supabase migration is NOT working correctly ❌');
    console.log('\nPlease apply the complete_migration.sql file to your Supabase instance:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of supabase/migrations/complete_migration.sql');
    console.log('4. Run the SQL commands');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});

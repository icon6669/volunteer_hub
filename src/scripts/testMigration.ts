import { verifyMigration, testUserSignup } from '../utils/verifyMigration';

/**
 * Script to test if the Supabase migration has been properly applied
 * This will:
 * 1. Check for the existence of key RLS policies and functions
 * 2. Test user signup to verify the trigger is working
 */
async function runTests() {
  console.log('Verifying Supabase migration...');
  
  // Step 1: Verify migration components
  const migrationStatus = await verifyMigration();
  
  console.log('\n=== Migration Verification Results ===');
  console.log(`Overall status: ${migrationStatus.success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  
  if (migrationStatus.missingComponents.length > 0) {
    console.log('\nMissing components:');
    migrationStatus.missingComponents.forEach(component => {
      console.log(`- ${component} ❌`);
    });
    
    console.log('\nYou need to apply the migration SQL to your Supabase instance.');
    console.log('Please run the complete_migration.sql file in the Supabase SQL editor.');
    return;
  }
  
  console.log('\nAll migration components are present ✅');
  
  // Step 2: Test user signup
  console.log('\n=== Testing User Signup ===');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';
  
  console.log(`Creating test user: ${testEmail}`);
  const signupResult = await testUserSignup(testEmail, testPassword);
  
  if (signupResult.success) {
    console.log(`User signup successful! User ID: ${signupResult.userId} ✅`);
    console.log('The migration is working correctly.');
  } else {
    console.log(`User signup failed: ${signupResult.error} ❌`);
    console.log('The migration is not working correctly.');
    
    if (signupResult.userId) {
      console.log(`Auth user was created (ID: ${signupResult.userId}), but database record failed.`);
      console.log('This indicates that the trigger function is not working properly.');
    }
    
    console.log('\nPlease check the following:');
    console.log('1. The create_user_on_signup function exists and is correctly implemented');
    console.log('2. The trigger on auth.users is correctly set up');
    console.log('3. RLS policies allow the trigger function to insert into the users table');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});

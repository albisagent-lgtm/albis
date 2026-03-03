#!/usr/bin/env node

/**
 * Test Supabase connection and auth setup
 * Run: node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const env = {};
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  // Test 1: Check connection
  console.log('1️⃣ Testing basic connection...');
  const { data: testData, error: testError } = await supabase.from('profiles').select('count');
  
  if (testError && !testError.message.includes('table') && !testError.message.includes('schema cache')) {
    console.error('❌ Connection failed:', testError.message);
    process.exit(1);
  }
  
  console.log('✅ Connection successful!\n');

  // Test 2: Check if profiles table exists
  console.log('2️⃣ Checking if profiles table exists...');
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id').limit(1);
  
  if (profileError) {
    if (profileError.code === 'PGRST116' || profileError.message.includes('does not exist')) {
      console.log('⚠️  Profiles table does not exist yet');
      console.log('   👉 Run the SQL in supabase-setup.sql first!\n');
    } else {
      console.error('❌ Error checking profiles table:', profileError.message);
    }
  } else {
    console.log('✅ Profiles table exists!\n');
  }

  // Test 3: Try a test signup (then delete)
  console.log('3️⃣ Testing auth signup (will delete test user after)...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error('❌ Signup test failed:', signUpError.message);
    console.log('   This might be expected if email confirmation is required\n');
  } else {
    console.log('✅ Auth signup works!');
    
    // Clean up test user (requires service role key)
    if (env.SUPABASE_SERVICE_ROLE_KEY && signUpData.user) {
      const adminSupabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
      await adminSupabase.auth.admin.deleteUser(signUpData.user.id);
      console.log('✅ Test user cleaned up\n');
    }
  }

  console.log('🎉 All tests complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Make sure SQL in supabase-setup.sql has been run');
  console.log('   2. Try signing up at /signup');
  console.log('   3. Check Supabase dashboard → Auth → Users');
}

testConnection().catch(console.error);

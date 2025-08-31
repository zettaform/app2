#!/usr/bin/env node

/**
 * Test script for external user creation API
 * This demonstrates how to create users externally using the admin global key
 */

const ADMIN_KEY = 'admin_global_key_2024_secure_123';
const API_BASE = 'http://localhost:3001';

async function testExternalUserCreation() {
  console.log('🔑 Testing External User Creation API\n');
  
  // Test 1: Create user with admin key
  console.log('📝 Test 1: Creating user with valid admin key...');
  try {
    const response = await fetch(`${API_BASE}/api/external/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify({
        first_name: 'API',
        last_name: 'TestUser',
        email: `api-test-${Date.now()}@example.com`,
        password: 'securepassword123',
        role: 'user',
        status: 'active'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('   User ID:', result.user.user_id);
      console.log('   Email:', result.user.email);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Try to create user without admin key
  console.log('📝 Test 2: Attempting to create user without admin key...');
  try {
    const response = await fetch(`${API_BASE}/api/external/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: 'Unauthorized',
        last_name: 'User',
        email: 'unauthorized@example.com',
        password: 'password123',
        role: 'user',
        status: 'active'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected (401 Unauthorized):', result.error);
    } else {
      console.log('❌ Unexpected response:', response.status, result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Try to create user with invalid admin key
  console.log('📝 Test 3: Attempting to create user with invalid admin key...');
  try {
    const response = await fetch(`${API_BASE}/api/external/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'invalid_key'
      },
      body: JSON.stringify({
        first_name: 'Invalid',
        last_name: 'User',
        email: 'invalid@example.com',
        password: 'password123',
        role: 'user',
        status: 'active'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected (401 Unauthorized):', result.error);
    } else {
      console.log('❌ Unexpected response:', response.status, result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Get admin key info
  console.log('📝 Test 4: Getting admin key information...');
  try {
    const response = await fetch(`${API_BASE}/api/admin/key-info`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('   Usage:', result.usage);
      console.log('   Endpoints:', result.endpoints.join(', '));
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: List users to see the created user
  console.log('📝 Test 5: Listing users to verify creation...');
  try {
    const response = await fetch(`${API_BASE}/api/users`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success: Found', result.users.length, 'users');
      const apiUsers = result.users.filter(u => u.email.includes('api-test-'));
      if (apiUsers.length > 0) {
        console.log('   API-created users found:', apiUsers.length);
        apiUsers.forEach(user => {
          console.log(`     - ${user.first_name} ${user.last_name} (${user.email}) - ${user.status}`);
        });
      } else {
        console.log('   No API-created users found');
      }
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the test
testExternalUserCreation().catch(console.error);

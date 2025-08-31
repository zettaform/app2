#!/usr/bin/env node

/**
 * Test script for GET user creation API
 * This demonstrates how to create users via GET requests in the browser
 */

const ADMIN_KEY = 'admin_global_key_2024_secure_123';
const API_BASE = 'http://localhost:3001';

async function testGetUserCreation() {
  console.log('🔑 Testing GET User Creation API\n');
  
  // Test 1: Create user via GET with query parameters
  console.log('📝 Test 1: Creating user via GET request...');
  try {
    const params = new URLSearchParams({
      first_name: 'GET',
      last_name: 'TestUser',
      email: `get-test-${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
      status: 'active',
      avatar: 'goku',
      'x-admin-key': ADMIN_KEY
    });
    
    const url = `${API_BASE}/api/external/users?${params.toString()}`;
    console.log('URL:', url);
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('   User ID:', result.user.user_id);
      console.log('   Email:', result.user.email);
      console.log('   Method:', result.method);
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
    const params = new URLSearchParams({
      first_name: 'Unauthorized',
      last_name: 'User',
      email: 'unauthorized@example.com',
      password: 'password123'
    });
    
    const url = `${API_BASE}/api/external/users?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected (401 Unauthorized):', result.error);
      console.log('   Usage hint:', result.usage);
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
    const params = new URLSearchParams({
      first_name: 'Invalid',
      last_name: 'User',
      email: 'invalid@example.com',
      password: 'password123',
      'x-admin-key': 'invalid_key'
    });
    
    const url = `${API_BASE}/api/external/users?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected (401 Unauthorized):', result.error);
      console.log('   Usage hint:', result.usage);
    } else {
      console.log('❌ Unexpected response:', response.status, result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Create user with minimal parameters
  console.log('📝 Test 4: Creating user with minimal required parameters...');
  try {
    const params = new URLSearchParams({
      first_name: 'Minimal',
      last_name: 'User',
      email: `minimal-${Date.now()}@example.com`,
      password: 'password123',
      'x-admin-key': ADMIN_KEY
    });
    
    const url = `${API_BASE}/api/external/users?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('   User ID:', result.user.user_id);
      console.log('   Role (default):', result.user.role);
      console.log('   Status (default):', result.user.status);
      console.log('   Avatar (default):', result.user.avatar || 'goku');
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Create user with all parameters
  console.log('📝 Test 5: Creating user with all parameters specified...');
  try {
    const params = new URLSearchParams({
      first_name: 'Complete',
      last_name: 'User',
      email: `complete-${Date.now()}@example.com`,
      password: 'password123',
      role: 'manager',
      status: 'pending',
      avatar: 'vegeta',
      'x-admin-key': ADMIN_KEY
    });
    
    const url = `${API_BASE}/api/external/users?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('   User ID:', result.user.user_id);
      console.log('   Role:', result.user.role);
      console.log('   Status:', result.user.status);
      console.log('   Avatar:', result.user.avatar);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 6: Test missing required fields
  console.log('📝 Test 6: Testing missing required fields...');
  try {
    const params = new URLSearchParams({
      first_name: 'Missing',
      // Missing last_name
      email: 'missing@example.com',
      // Missing password
      'x-admin-key': ADMIN_KEY
    });
    
    const url = `${API_BASE}/api/external/users?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected (400 Bad Request):', result.error);
      console.log('   Usage hint:', result.usage);
    } else {
      console.log('❌ Unexpected response:', response.status, result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 7: Get admin key info
  console.log('📝 Test 7: Getting updated admin key information...');
  try {
    const response = await fetch(`${API_BASE}/api/admin/key-info`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('   POST Usage:', result.usage.post);
      console.log('   GET Usage:', result.usage.get);
      console.log('   Endpoints:', result.endpoints.join(', '));
      console.log('   GET Example:', result.examples.get);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 8: List users to verify creation
  console.log('📝 Test 8: Listing users to verify creation...');
  try {
    const response = await fetch(`${API_BASE}/api/users`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success: Found', result.users.length, 'users');
      const getUsers = result.users.filter(u => u.email.includes('get-test-') || u.email.includes('minimal-') || u.email.includes('complete-'));
      if (getUsers.length > 0) {
        console.log('   GET-created users found:', getUsers.length);
        getUsers.forEach(user => {
          console.log(`     - ${user.first_name} ${user.last_name} (${user.email}) - ${user.status} - ${user.role}`);
        });
      } else {
        console.log('   No GET-created users found');
      }
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 9: Browser-friendly URL examples
  console.log('📝 Test 9: Browser-friendly URL examples...');
  console.log('🌐 You can now create users directly in your browser using these URLs:');
  console.log('');
  console.log('Basic User:');
  console.log(`${API_BASE}/api/external/users?first_name=Alice&last_name=Smith&email=alice@example.com&password=password123&x-admin-key=${ADMIN_KEY}`);
  console.log('');
  console.log('Manager User:');
  console.log(`${API_BASE}/api/external/users?first_name=Bob&last_name=Manager&email=bob@example.com&password=manager123&role=manager&status=active&x-admin-key=${ADMIN_KEY}`);
  console.log('');
  console.log('Admin User:');
  console.log(`${API_BASE}/api/external/users?first_name=Admin&last_name=User&email=admin@example.com&password=admin123&role=admin&status=active&avatar=vegeta&x-admin-key=${ADMIN_KEY}`);
  console.log('');
  console.log('📱 Demo Page: http://localhost:5174/user-creation-demo.html');
}

// Run the test
testGetUserCreation().catch(console.error);

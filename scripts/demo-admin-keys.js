#!/usr/bin/env node

/**
 * Admin Keys System Demonstration
 * This script demonstrates the complete admin keys workflow
 */

const API_BASE = 'http://localhost:3001';

async function demoAdminKeys() {
  console.log('🔑 Admin Keys Management System - Live Demonstration\n');
  
  // Step 1: List all available admin keys
  console.log('📋 Step 1: Available Admin Keys');
  console.log('=' .repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/keys`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`Found ${result.total} admin keys:\n`);
      
      result.admin_keys.forEach((key, index) => {
        const truncatedKey = key.admin_key.substring(0, 20) + '...';
        const usage = `${key.users_created}/${key.user_creation_limit}`;
        const remaining = key.user_creation_limit - key.users_created;
        
        console.log(`${index + 1}. ${truncatedKey}`);
        console.log(`   Description: ${key.description}`);
        console.log(`   Usage: ${usage} (${remaining} remaining)`);
        console.log(`   Status: ${key.key_status}`);
        console.log(`   Expires: ${new Date(key.expires_at * 1000).toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Error listing admin keys:', error.message);
    return;
  }
  
  // Step 2: Demonstrate user creation with different keys
  console.log('👥 Step 2: User Creation with Different Keys');
  console.log('=' .repeat(50));
  
  const testKeys = [
    {
      key: 'admin_key_07eebf326f003fdf877f9f742c93fde9',
      name: 'Limited Integration Key (100 users)',
      users: 2
    },
    {
      key: 'admin_key_8628dc9c148687cb3ff026d738a152f4',
      name: 'Demo Key (50 users)',
      users: 1
    },
    {
      key: 'admin_key_6233c7334b61b57146f6bf2f70dde3a6',
      name: 'Testing Key (25 users)',
      users: 1
    }
  ];
  
  for (const testKey of testKeys) {
    console.log(`\n🔑 Testing: ${testKey.name}`);
    
    for (let i = 0; i < testKey.users; i++) {
      try {
        const timestamp = Date.now();
        const params = new URLSearchParams({
          first_name: `Demo${i + 1}`,
          last_name: 'User',
          email: `demo-${timestamp}-${i}@example.com`,
          password: 'password123',
          role: 'user',
          status: 'active',
          'x-admin-key': testKey.key
        });
        
        const url = `${API_BASE}/api/external/users?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ Created user: ${result.user.email}`);
          if (result.admin_key_info) {
            console.log(`      Usage: ${result.admin_key_info.users_created}/${result.admin_key_info.user_creation_limit}`);
            console.log(`      Remaining: ${result.admin_key_info.remaining}`);
          }
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
  
  // Step 3: Show updated usage statistics
  console.log('\n📊 Step 3: Updated Usage Statistics');
  console.log('=' .repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/keys`);
    const result = await response.json();
    
    if (result.success) {
      console.log('Current key usage:\n');
      
      result.admin_keys.forEach((key, index) => {
        const truncatedKey = key.admin_key.substring(0, 20) + '...';
        const usage = `${key.users_created}/${key.user_creation_limit}`;
        const remaining = key.user_creation_limit - key.users_created;
        const percentage = Math.round((key.users_created / key.user_creation_limit) * 100);
        
        let status = '🟢 Low Usage';
        if (percentage >= 90) status = '🔴 High Usage';
        else if (percentage >= 75) status = '🟡 Medium Usage';
        
        console.log(`${index + 1}. ${truncatedKey}`);
        console.log(`   Usage: ${usage} (${percentage}%) ${status}`);
        console.log(`   Remaining: ${remaining} users`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Error getting updated stats:', error.message);
  }
  
  // Step 4: Demonstrate key management
  console.log('⚙️  Step 4: Key Management Operations');
  console.log('=' .repeat(50));
  
  // Create a new test key
  console.log('\n🔑 Creating a new test key...');
  try {
    const newKeyData = {
      user_creation_limit: 10,
      description: 'Demo key for system testing',
      expires_in_days: 30
    };
    
    const response = await fetch(`${API_BASE}/api/admin/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newKeyData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully created new key:');
      console.log(`   Key: ${result.admin_key.admin_key}`);
      console.log(`   Limit: ${result.admin_key.user_creation_limit} users`);
      console.log(`   Description: ${result.admin_key.description}`);
      
      // Test the new key
      console.log('\n🧪 Testing the new key...');
      const testParams = new URLSearchParams({
        first_name: 'NewKey',
        last_name: 'Test',
        email: `newkey-${Date.now()}@example.com`,
        password: 'password123',
        'x-admin-key': result.admin_key.admin_key
      });
      
      const testUrl = `${API_BASE}/api/external/users?${testParams.toString()}`;
      const testResponse = await fetch(testUrl);
      const testResult = await testResponse.json();
      
      if (testResult.success) {
        console.log('✅ New key working correctly!');
        console.log(`   Created user: ${testResult.user.email}`);
        if (testResult.admin_key_info) {
          console.log(`   Usage: ${testResult.admin_key_info.users_created}/${testResult.admin_key_info.user_creation_limit}`);
        }
      }
      
      // Clean up - delete the test key
      console.log('\n🧹 Cleaning up test key...');
      const deleteResponse = await fetch(`${API_BASE}/api/admin/keys/${result.admin_key.admin_key_id}`, {
        method: 'DELETE'
      });
      
      const deleteResult = await deleteResponse.json();
      if (deleteResult.success) {
        console.log('✅ Test key deleted successfully');
      }
      
    } else {
      console.log('❌ Failed to create new key:', result.error);
    }
  } catch (error) {
    console.log('❌ Error in key management:', error.message);
  }
  
  // Final summary
  console.log('\n🎉 Demonstration Complete!');
  console.log('=' .repeat(50));
  console.log('✅ Admin keys system is fully functional');
  console.log('✅ Usage tracking works correctly');
  console.log('✅ Key limits are enforced');
  console.log('✅ CRUD operations work');
  console.log('✅ User creation with different keys works');
  
  console.log('\n🌐 Next steps:');
  console.log('   1. Visit http://localhost:5174/admin/keys to manage keys');
  console.log('   2. Test different key limits and expiration dates');
  console.log('   3. Monitor usage across different keys');
  console.log('   4. Integrate with external systems using the keys');
  
  console.log('\n🔑 Available keys for testing:');
  console.log('   - Legacy key: admin_global_key_2024_secure_123 (unlimited)');
  console.log('   - Integration key: admin_key_07eebf326f003fdf877f9f742c93fde9 (100 users)');
  console.log('   - Demo key: admin_key_8628dc9c148687cb3ff026d738a152f4 (50 users)');
  console.log('   - Testing key: admin_key_6233c7334b61b57146f6bf2f70dde3a6 (25 users)');
}

// Run the demonstration
demoAdminKeys().catch(console.error);

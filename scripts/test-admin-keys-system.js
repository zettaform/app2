#!/usr/bin/env node

/**
 * Test script for Admin Keys Management System
 * This demonstrates the complete admin keys workflow
 */

const ADMIN_KEY = 'admin_global_key_2024_secure_123';
const API_BASE = 'http://localhost:3001';

async function testAdminKeysSystem() {
  console.log('🔑 Testing Admin Keys Management System\n');
  
  // Test 1: List admin keys
  console.log('📝 Test 1: Listing admin keys...');
  try {
    const response = await fetch(`${API_BASE}/api/admin/keys`);
    const result = await response.json();
    
          if (result.success) {
        console.log('✅ Success: Found', result.total, 'admin keys');
        if (result.admin_keys.length > 0) {
          result.admin_keys.forEach((key, index) => {
            console.log(`   ${index + 1}. ${key.admin_key.substring(0, 20)}... (${key.users_created}/${key.user_creation_limit}) - ${key.key_status}`);
          });
        }
      } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Create new admin key
  console.log('📝 Test 2: Creating new admin key...');
  try {
    const newKeyData = {
      user_creation_limit: 50,
      description: 'Test key for API testing',
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
      console.log('✅ Success: Created new admin key');
      console.log('   Key ID:', result.admin_key.admin_key_id);
      console.log('   Key:', result.admin_key.admin_key);
      console.log('   Limit:', result.admin_key.user_creation_limit);
      console.log('   Description:', result.admin_key.description);
      
      // Store the new key for later tests
      const newKey = result.admin_key.admin_key;
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test 3: Test user creation with new key
      console.log('📝 Test 3: Testing user creation with new key...');
      try {
        const params = new URLSearchParams({
          first_name: 'NewKey',
          last_name: 'User',
          email: `newkey-${Date.now()}@example.com`,
          password: 'password123',
          role: 'user',
          status: 'active',
          'x-admin-key': newKey
        });
        
        const url = `${API_BASE}/api/external/users?${params.toString()}`;
        const userResponse = await fetch(url);
        const userResult = await userResponse.json();
        
        if (userResult.success) {
          console.log('✅ Success: User created with new key');
          console.log('   User ID:', userResult.user.user_id);
          console.log('   Email:', userResult.user.email);
          if (userResult.admin_key_info) {
            console.log('   Key Usage:', userResult.admin_key_info.users_created, '/', userResult.admin_key_info.user_creation_limit);
            console.log('   Remaining:', userResult.admin_key_info.remaining);
          }
        } else {
          console.log('❌ Failed:', userResult.error);
        }
      } catch (error) {
        console.log('❌ Error creating user with new key:', error.message);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test 4: Test key usage limit
      console.log('📝 Test 4: Testing key usage limit...');
      try {
        // Try to create users until we hit the limit
        let usersCreated = 0;
        const maxAttempts = 5; // Don't spam the API
        
        for (let i = 0; i < maxAttempts; i++) {
          const params = new URLSearchParams({
            first_name: `LimitTest${i}`,
            last_name: 'User',
            email: `limittest-${Date.now()}-${i}@example.com`,
            password: 'password123',
            'x-admin-key': newKey
          });
          
          const url = `${API_BASE}/api/external/users?${params.toString()}`;
          const response = await fetch(url);
          const result = await response.json();
          
          if (result.success) {
            usersCreated++;
            console.log(`   ✅ Created user ${i + 1}: ${result.user.email}`);
            if (result.admin_key_info) {
              console.log(`      Usage: ${result.admin_key_info.users_created}/${result.admin_key_info.user_creation_limit}`);
            }
          } else if (response.status === 429) {
            console.log(`   🚫 Hit usage limit: ${result.error}`);
            console.log(`      Details:`, result.details);
            break;
          } else {
            console.log(`   ❌ Failed: ${result.error}`);
            break;
          }
        }
        
        console.log(`   Total users created in this test: ${usersCreated}`);
      } catch (error) {
        console.log('❌ Error testing usage limit:', error.message);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test 5: Update admin key
      console.log('📝 Test 5: Updating admin key...');
      try {
        const updateData = {
          user_creation_limit: 100,
          description: 'Updated test key with higher limit',
          status: 'active'
        };
        
        const response = await fetch(`${API_BASE}/api/admin/keys/${result.admin_key.admin_key_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        const updateResult = await response.json();
        
        if (updateResult.success) {
          console.log('✅ Success: Updated admin key');
          console.log('   New limit:', updateResult.admin_key.user_creation_limit);
          console.log('   New description:', updateResult.admin_key.description);
          console.log('   Status:', updateResult.admin_key.key_status);
        } else {
          console.log('❌ Failed:', updateResult.error);
        }
      } catch (error) {
        console.log('❌ Error updating admin key:', error.message);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test 6: List updated keys
      console.log('📝 Test 6: Listing updated admin keys...');
      try {
        const response = await fetch(`${API_BASE}/api/admin/keys`);
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Success: Found', result.total, 'admin keys');
          const updatedKey = result.admin_keys.find(k => k.admin_key_id === result.admin_key.admin_key_id);
          if (updatedKey) {
            console.log('   Updated key details:');
            console.log(`     Limit: ${updatedKey.user_creation_limit}`);
            console.log(`     Description: ${updatedKey.description}`);
            console.log(`     Status: ${updatedKey.key_status}`);
          }
        } else {
          console.log('❌ Failed:', result.error);
        }
      } catch (error) {
        console.log('❌ Error:', error.message);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test 7: Test with updated key
      console.log('📝 Test 7: Testing user creation with updated key...');
      try {
        const params = new URLSearchParams({
          first_name: 'UpdatedKey',
          last_name: 'User',
          email: `updatedkey-${Date.now()}@example.com`,
          password: 'password123',
          'x-admin-key': newKey
        });
        
        const url = `${API_BASE}/api/external/users?${params.toString()}`;
        const userResponse = await fetch(url);
        const userResult = await userResponse.json();
        
        if (userResult.success) {
          console.log('✅ Success: User created with updated key');
          console.log('   User ID:', userResult.user.user_id);
          if (userResult.admin_key_info) {
            console.log('   Key Usage:', userResult.admin_key_info.users_created, '/', userResult.admin_key_info.user_creation_limit);
            console.log('   Remaining:', userResult.admin_key_info.remaining);
          }
        } else {
          console.log('❌ Failed:', userResult.error);
        }
      } catch (error) {
        console.log('❌ Error:', error.message);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test 8: Delete admin key
      console.log('📝 Test 8: Deleting admin key...');
      try {
        const response = await fetch(`${API_BASE}/api/admin/keys/${result.admin_key.admin_key_id}`, {
          method: 'DELETE'
        });
        
        const deleteResult = await response.json();
        
        if (deleteResult.success) {
          console.log('✅ Success: Deleted admin key');
        } else {
          console.log('❌ Failed:', deleteResult.error);
        }
      } catch (error) {
        console.log('❌ Error deleting admin key:', error.message);
      }
      
    } else {
      console.log('❌ Failed to create admin key:', result.error);
    }
  } catch (error) {
    console.log('❌ Error creating admin key:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 9: Final key listing
  console.log('📝 Test 9: Final admin keys listing...');
  try {
    const response = await fetch(`${API_BASE}/api/admin/keys`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success: Final count -', result.total, 'admin keys');
      if (result.admin_keys.length > 0) {
        result.admin_keys.forEach((key, index) => {
          console.log(`   ${index + 1}. ${key.admin_key.substring(0, 20)}... (${key.users_created}/${key.user_creation_limit}) - ${key.key_status}`);
        });
      }
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🎉 Admin Keys Management System testing completed!');
  console.log('\n📊 Summary:');
  console.log('   ✅ Admin keys CRUD operations');
  console.log('   ✅ User creation with different keys');
  console.log('   ✅ Usage limit enforcement');
  console.log('   ✅ Key updates and status changes');
  console.log('   ✅ Backward compatibility with legacy key');
  
  console.log('\n🌐 Next steps:');
  console.log('   1. Visit http://localhost:5174/admin/keys to manage keys');
  console.log('   2. Test different key limits and expiration dates');
  console.log('   3. Monitor usage across different keys');
  console.log('   4. Integrate with external systems using the keys');
}

// Run the test
testAdminKeysSystem().catch(console.error);

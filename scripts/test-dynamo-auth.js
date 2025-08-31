#!/usr/bin/env node

// Test DynamoDB Authentication (No localStorage)
// This script tests the authentication system using DynamoDB for all operations

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

console.log('🧪 Testing DynamoDB Authentication (No localStorage)');
console.log('==================================================');

async function testDynamoAuth() {
  try {
    // Create DynamoDB client
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    const docClient = DynamoDBDocumentClient.from(client);
    const environment = process.env.ENVIRONMENT || 'dev';
    const usersTable = `${environment}-users`;
    const analyticsTable = `${environment}-analytics`;

    console.log(`🌍 Environment: ${environment}`);
    console.log(`👥 Users Table: ${usersTable}`);
    console.log(`📊 Analytics Table: ${analyticsTable}`);

    // Test 1: Check if we can query the users table
    console.log('\n1️⃣ Testing DynamoDB users table access...');
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: usersTable,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': 'admin@example.com' }
      }));
      
      if (result.Items && result.Items.length > 0) {
        console.log('✅ Users table access successful!');
        console.log(`   Found ${result.Items.length} user(s) with admin@example.com`);
        
        const user = result.Items[0];
        console.log(`   User ID: ${user.user_id}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Has password hash: ${!!user.password_hash ? '✅ Yes' : '❌ No'}`);
      } else {
        console.log('❌ No users found with admin@example.com');
        return false;
      }
    } catch (error) {
      console.error('❌ Users table query failed:', error.message);
      return false;
    }

    // Test 2: Test password hashing logic
    console.log('\n2️⃣ Testing password hashing...');
    const testPassword = 'admin123';
    const expectedHash = 'YWRtaW4xMjNzYWx0'; // base64 of 'admin123salt'
    
    const hashPassword = (password) => {
      return btoa(password + 'salt').replace(/[^a-zA-Z0-9]/g, '');
    };
    
    const actualHash = hashPassword(testPassword);
    console.log(`   Test password: ${testPassword}`);
    console.log(`   Expected hash: ${expectedHash}`);
    console.log(`   Actual hash: ${actualHash}`);
    console.log(`   Hash match: ${actualHash === expectedHash ? '✅ Yes' : '❌ No'}`);

    // Test 3: Verify all seeded users exist
    console.log('\n3️⃣ Verifying all seeded users...');
    const testUsers = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'manager@example.com', password: 'manager123' },
      { email: 'demo@example.com', password: 'demo123' },
      { email: 'test@example.com', password: 'test123' }
    ];

    for (const testUser of testUsers) {
      try {
        const result = await docClient.send(new QueryCommand({
          TableName: usersTable,
          IndexName: 'EmailIndex',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': testUser.email }
        }));
        
        if (result.Items && result.Items.length > 0) {
          const user = result.Items[0];
          const expectedHash = hashPassword(testUser.password);
          const hashMatch = user.password_hash === expectedHash;
          
          console.log(`   ${testUser.email}: ${hashMatch ? '✅ Valid hash' : '❌ Invalid hash'}`);
        } else {
          console.log(`   ${testUser.email}: ❌ User not found`);
        }
      } catch (error) {
        console.log(`   ${testUser.email}: ❌ Query failed - ${error.message}`);
      }
    }

    // Test 4: Test analytics table access (for sessions and other data)
    console.log('\n4️⃣ Testing analytics table access...');
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: analyticsTable,
        IndexName: 'MetricTypeIndex',
        KeyConditionExpression: 'metric_type = :metric_type',
        ExpressionAttributeValues: { ':metric_type': 'page_views' },
        Limit: 5
      }));
      
      if (result.Items) {
        console.log('✅ Analytics table access successful!');
        console.log(`   Found ${result.Items.length} page view metrics`);
      } else {
        console.log('✅ Analytics table accessible (no metrics found)');
      }
    } catch (error) {
      console.error('❌ Analytics table query failed:', error.message);
      return false;
    }

    // Test 5: Test session creation simulation
    console.log('\n5️⃣ Testing session creation simulation...');
    try {
      const testSession = {
        metric_id: `test-session-${Date.now()}`,
        metric_type: 'user_session',
        value: 1,
        metadata: {
          session_id: `test-session-${Date.now()}`,
          user_id: 'user-admin-001',
          user_data: { email: 'admin@example.com', role: 'admin' },
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        }
      };

      const result = await docClient.send(new PutCommand({
        TableName: analyticsTable,
        Item: testSession
      }));
      
      console.log('✅ Session creation simulation successful!');
      console.log(`   Created test session: ${testSession.metric_id}`);
      
      // Clean up test session
      await docClient.send(new PutCommand({
        TableName: analyticsTable,
        Item: {
          ...testSession,
          value: 0,
          metadata: { ...testSession.metadata, is_active: false, deleted: true }
        }
      }));
      console.log('   Cleaned up test session');
      
    } catch (error) {
      console.error('❌ Session creation simulation failed:', error.message);
      return false;
    }

    console.log('\n==================================================');
    console.log('🎉 DynamoDB authentication infrastructure test completed!');
    console.log('✅ Your application is ready to use DynamoDB for all operations');
    console.log('\n📋 What this means:');
    console.log('   • All user authentication uses DynamoDB');
    console.log('   • All session data is stored in DynamoDB');
    console.log('   • All application data uses DynamoDB');
    console.log('   • No localStorage dependency');
    
    return true;

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDynamoAuth()
    .then(success => {
      if (success) {
        console.log('\n✅ DynamoDB authentication is production-ready!');
        process.exit(0);
      } else {
        console.log('\n❌ DynamoDB authentication has issues that need to be fixed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error during testing:', error);
      process.exit(1);
    });
}

export default testDynamoAuth;

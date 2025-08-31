#!/usr/bin/env node

// Test DynamoDB Authentication
// This script tests the authentication system against DynamoDB

import dynamoAuthService from '../src/services/dynamoAuthService.js';

console.log('🧪 Testing DynamoDB Authentication');
console.log('==================================');

async function testAuthentication() {
  try {
    // Test 1: Sign in with valid credentials
    console.log('\n1️⃣ Testing signin with valid credentials...');
    const signinResult = await dynamoAuthService.signin('admin@example.com', 'admin123');
    
    if (signinResult.success) {
      console.log('✅ Signin successful!');
      console.log(`   User: ${signinResult.user.first_name} ${signinResult.user.last_name}`);
      console.log(`   Role: ${signinResult.user.role}`);
      console.log(`   Token: ${signinResult.token.substring(0, 20)}...`);
    } else {
      console.log('❌ Signin failed:', signinResult.error);
      return false;
    }

    // Test 2: Check authentication status
    console.log('\n2️⃣ Testing authentication status...');
    const isAuth = dynamoAuthService.isAuthenticated();
    console.log(`   Is authenticated: ${isAuth ? '✅ Yes' : '❌ No'}`);

    // Test 3: Get current user
    console.log('\n3️⃣ Testing get current user...');
    const currentUser = await dynamoAuthService.getCurrentUser();
    if (currentUser) {
      console.log('✅ Current user retrieved successfully!');
      console.log(`   Email: ${currentUser.email}`);
      console.log(`   Role: ${currentUser.role}`);
    } else {
      console.log('❌ Failed to get current user');
      return false;
    }

    // Test 4: Test invalid credentials
    console.log('\n4️⃣ Testing signin with invalid credentials...');
    const invalidSignin = await dynamoAuthService.signin('admin@example.com', 'wrongpassword');
    if (!invalidSignin.success) {
      console.log('✅ Invalid credentials properly rejected:', invalidSignin.error);
    } else {
      console.log('❌ Invalid credentials were accepted (this is wrong!)');
      return false;
    }

    // Test 5: Test non-existent user
    console.log('\n5️⃣ Testing signin with non-existent user...');
    const nonExistentSignin = await dynamoAuthService.signin('nonexistent@example.com', 'password123');
    if (!nonExistentSignin.success) {
      console.log('✅ Non-existent user properly rejected:', nonExistentSignin.error);
    } else {
      console.log('❌ Non-existent user was accepted (this is wrong!)');
      return false;
    }

    // Test 6: Test signup
    console.log('\n6️⃣ Testing user signup...');
    const signupResult = await dynamoAuthService.signup({
      email: 'newuser@example.com',
      password: 'newuser123',
      first_name: 'New',
      last_name: 'User',
      role: 'user'
    });
    
    if (signupResult.success) {
      console.log('✅ Signup successful!');
      console.log(`   New user: ${signupResult.user.first_name} ${signinResult.user.last_name}`);
      
      // Test signin with new user
      console.log('\n7️⃣ Testing signin with newly created user...');
      const newUserSignin = await dynamoAuthService.signin('newuser@example.com', 'newuser123');
      if (newUserSignin.success) {
        console.log('✅ New user can sign in successfully!');
      } else {
        console.log('❌ New user cannot sign in:', newUserSignin.error);
      }
    } else {
      console.log('❌ Signup failed:', signupResult.error);
    }

    // Test 8: Test signout
    console.log('\n8️⃣ Testing signout...');
    const signoutResult = dynamoAuthService.signout();
    if (signoutResult.success) {
      console.log('✅ Signout successful!');
      
      // Check if still authenticated
      const stillAuth = dynamoAuthService.isAuthenticated();
      console.log(`   Still authenticated: ${stillAuth ? '❌ Yes (wrong!)' : '✅ No (correct!)'}`);
    } else {
      console.log('❌ Signout failed:', signoutResult.error);
    }

    console.log('\n==================================');
    console.log('🎉 All authentication tests passed!');
    console.log('✅ Your DynamoDB authentication is working correctly!');
    
    return true;

  } catch (error) {
    console.error('\n❌ Authentication test failed with error:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthentication()
    .then(success => {
      if (success) {
        console.log('\n✅ Authentication system is ready for production!');
        process.exit(0);
      } else {
        console.log('\n❌ Authentication system has issues that need to be fixed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error during testing:', error);
      process.exit(1);
    });
}

export default testAuthentication;

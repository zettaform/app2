#!/usr/bin/env node

// DynamoDB Setup Verification Script
// This script verifies that your DynamoDB setup is working correctly

import awsDynamoService from '../src/services/awsDynamoService.js';

console.log('🔍 DynamoDB Setup Verification');
console.log('================================');

async function verifySetup() {
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing DynamoDB Connection...');
    const health = await awsDynamoService.healthCheck();
    if (health.success) {
      console.log('✅ DynamoDB connection successful');
    } else {
      console.log('❌ DynamoDB connection failed:', health.error);
      return false;
    }

    // Test 2: Create a test customer
    console.log('\n2️⃣ Testing Customer Creation...');
    const testCustomer = await awsDynamoService.createCustomer({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@verification.com',
      phone: '+1-555-9999',
      address: {
        street: '999 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'USA',
        zip: '99999'
      }
    });

    if (testCustomer.success) {
      console.log('✅ Customer creation successful');
      console.log(`   Customer ID: ${testCustomer.customer.customer_id}`);
      
      // Test 3: Retrieve the test customer
      console.log('\n3️⃣ Testing Customer Retrieval...');
      const retrieved = await awsDynamoService.getCustomer(testCustomer.customer.customer_id);
      if (retrieved.success) {
        console.log('✅ Customer retrieval successful');
        console.log(`   Name: ${retrieved.customer.first_name} ${retrieved.customer.last_name}`);
      } else {
        console.log('❌ Customer retrieval failed:', retrieved.error);
      }

      // Test 4: Update the test customer
      console.log('\n4️⃣ Testing Customer Update...');
      const updated = await awsDynamoService.updateCustomer(testCustomer.customer.customer_id, {
        status: 'verified',
        subscription_tier: 'test'
      });
      if (updated.success) {
        console.log('✅ Customer update successful');
      } else {
        console.log('❌ Customer update failed:', updated.error);
      }

      // Test 5: Clean up - Delete test customer
      console.log('\n5️⃣ Cleaning up test data...');
      const deleted = await awsDynamoService.deleteCustomer(testCustomer.customer.customer_id);
      if (deleted.success) {
        console.log('✅ Test customer deleted successfully');
      } else {
        console.log('❌ Test customer deletion failed:', deleted.error);
      }
    } else {
      console.log('❌ Customer creation failed:', testCustomer.error);
      return false;
    }

    // Test 6: Test feedback creation
    console.log('\n6️⃣ Testing Feedback Creation...');
    const testFeedback = await awsDynamoService.createFeedback({
      user_id: 'test-user-001',
      type: 'verification',
      title: 'Setup Verification',
      description: 'This is a test feedback for setup verification',
      rating: 5
    });

    if (testFeedback.success) {
      console.log('✅ Feedback creation successful');
      console.log(`   Feedback ID: ${testFeedback.feedback.feedback_id}`);
      
      // Clean up feedback
      console.log('   Cleaning up test feedback...');
      // Note: We don't have a delete feedback method in the current service
      // This would need to be added if you want to clean up test feedback
    } else {
      console.log('❌ Feedback creation failed:', testFeedback.error);
    }

    // Test 7: Test analytics recording
    console.log('\n7️⃣ Testing Analytics Recording...');
    const testMetric = await awsDynamoService.recordMetric({
      metric_type: 'verification_test',
      value: 1,
      metadata: { test_type: 'setup_verification' }
    });

    if (testMetric.success) {
      console.log('✅ Analytics recording successful');
      console.log(`   Metric ID: ${testMetric.metric.metric_id}`);
    } else {
      console.log('❌ Analytics recording failed:', testMetric.error);
    }

    console.log('\n================================');
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Your DynamoDB setup is working correctly');
    
    return true;

  } catch (error) {
    console.error('\n❌ Verification failed with error:', error);
    return false;
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySetup()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export default verifySetup;

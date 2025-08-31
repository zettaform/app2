#!/usr/bin/env node

/**
 * Seed Admin Keys DynamoDB Table
 * This script creates initial admin keys with usage limits
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

// Configuration
const REGION = process.env.AWS_REGION || 'us-east-1';
const ADMIN_KEYS_TABLE = process.env.ADMIN_KEYS_TABLE || 'admin-keys-table-admin-keys';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Generate a secure random admin key
function generateAdminKey() {
  return `admin_key_${crypto.randomBytes(16).toString('hex')}`;
}

// Create admin key item
function createAdminKeyItem(key, limit, description = '') {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
  
  return {
    admin_key_id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    admin_key: key,
    user_creation_limit: limit,
    users_created: 0,
    description: description,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: Math.floor(expiresAt.getTime() / 1000), // TTL in seconds
    key_status: 'active',
    created_by: 'system-seed'
  };
}

// Check if admin key already exists
async function checkKeyExists(adminKey) {
  try {
    const command = new QueryCommand({
      TableName: ADMIN_KEYS_TABLE,
      IndexName: 'AdminKeyIndex',
      KeyConditionExpression: 'admin_key = :key',
      ExpressionAttributeValues: { ':key': adminKey }
    });
    
    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0;
  } catch (error) {
    console.error('Error checking key existence:', error);
    return false;
  }
}

// Seed admin keys
async function seedAdminKeys() {
  console.log('🌱 Seeding Admin Keys DynamoDB Table...\n');
  
  const adminKeys = [
    {
      key: 'admin_global_key_2024_secure_123',
      limit: 1000,
      description: 'Master admin key for development and testing'
    },
    {
      key: generateAdminKey(),
      limit: 100,
      description: 'Limited access key for external integrations'
    },
    {
      key: generateAdminKey(),
      limit: 50,
      description: 'Restricted key for demo purposes'
    },
    {
      key: generateAdminKey(),
      limit: 25,
      description: 'Temporary key for testing'
    }
  ];
  
  console.log('📋 Admin Keys to create:');
  adminKeys.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.key} (Limit: ${item.limit} users) - ${item.description}`);
  });
  
  console.log('\n🚀 Creating admin keys...\n');
  
  for (const item of adminKeys) {
    try {
      // Check if key already exists
      const exists = await checkKeyExists(item.key);
      
      if (exists) {
        console.log(`⚠️  Key already exists: ${item.key}`);
        continue;
      }
      
      // Create admin key item
      const adminKeyItem = createAdminKeyItem(item.key, item.limit, item.description);
      
      const command = new PutCommand({
        TableName: ADMIN_KEYS_TABLE,
        Item: adminKeyItem
      });
      
      await docClient.send(command);
      
      console.log(`✅ Created admin key: ${item.key}`);
      console.log(`   ID: ${adminKeyItem.admin_key_id}`);
      console.log(`   Limit: ${item.limit} users`);
      console.log(`   Description: ${item.description}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error creating admin key ${item.key}:`, error.message);
    }
  }
  
  console.log('🎉 Admin keys seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   Table: ${ADMIN_KEYS_TABLE}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Keys created: ${adminKeys.length}`);
  
  console.log('\n🔑 Next steps:');
  console.log('   1. Update your server.js with the new table name');
  console.log('   2. Restart your server');
  console.log('   3. Test the new admin keys system');
}

// Run the seeding
seedAdminKeys().catch(console.error);

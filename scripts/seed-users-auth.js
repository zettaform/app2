#!/usr/bin/env node

// Seed Users Table with Authentication Data
// This script creates users with proper password hashes for authentication

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Simple password hashing (same as in dynamoAuthService)
const hashPassword = (password) => {
  return btoa(password + 'salt').replace(/[^a-zA-Z0-9]/g, '');
};

// Sample users with proper authentication data
const sampleUsers = [
  {
    user_id: 'user-admin-001',
    email: 'admin@example.com',
    password_hash: hashPassword('admin123'),
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    user_id: 'user-manager-001',
    email: 'manager@example.com',
    password_hash: hashPassword('manager123'),
    first_name: 'Manager',
    last_name: 'User',
    role: 'manager',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    user_id: 'user-demo-001',
    email: 'demo@example.com',
    password_hash: hashPassword('demo123'),
    first_name: 'Demo',
    last_name: 'User',
    role: 'user',
    status: 'active',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    user_id: 'user-test-001',
    email: 'test@example.com',
    password_hash: hashPassword('test123'),
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    status: 'active',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  }
];

class UserSeeder {
  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.environment = process.env.ENVIRONMENT || 'dev';
  }

  getTableName(baseName) {
    return `${this.environment}-${baseName}`;
  }

  async seedUsers() {
    console.log('🌱 Seeding users table with authentication data...');
    console.log(`🌍 Environment: ${this.environment}`);
    console.log('=====================================');
    
    try {
      for (const user of sampleUsers) {
        await this.docClient.send(new PutCommand({
          TableName: this.getTableName('users'),
          Item: user
        }));
        console.log(`✅ Added user: ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`   Role: ${user.role}, Password: ${user.email.split('@')[0]}123`);
      }
      
      console.log('\n=====================================');
      console.log('🎉 Users seeded successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Admin: admin@example.com / admin123');
      console.log('   Manager: manager@example.com / manager123');
      console.log('   Demo: demo@example.com / demo123');
      console.log('   Test: test@example.com / test123');
      
    } catch (error) {
      console.error('❌ Error seeding users:', error);
      throw error;
    }
  }
}

// Run the seeder if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new UserSeeder();
  seeder.seedUsers()
    .then(() => {
      console.log('\n✅ User seeding completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ User seeding failed:', error);
      process.exit(1);
    });
}

export default UserSeeder;

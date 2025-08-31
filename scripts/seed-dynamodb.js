// DynamoDB Data Seeding Script
// This script populates the DynamoDB tables with sample data

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

// Sample data for seeding
const sampleCustomers = [
  {
    customer_id: 'cust-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0101',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zip: '10001'
    },
    status: 'active',
    subscription_tier: 'premium',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    customer_id: 'cust-002',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0102',
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zip: '90210'
    },
    status: 'active',
    subscription_tier: 'basic',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z'
  },
  {
    customer_id: 'cust-003',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1-555-0103',
    address: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      zip: '60601'
    },
    status: 'inactive',
    subscription_tier: 'basic',
    created_at: '2024-01-17T12:00:00Z',
    updated_at: '2024-01-17T12:00:00Z'
  }
];

const sampleUsers = [
  {
    user_id: 'user-001',
    email: 'admin@example.com',
    password_hash: 'hashed_password_here',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    user_id: 'user-002',
    email: 'manager@example.com',
    password_hash: 'hashed_password_here',
    first_name: 'Manager',
    last_name: 'User',
    role: 'manager',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

const sampleFeedback = [
  {
    feedback_id: 'fb-001',
    user_id: 'user-001',
    type: 'feature_request',
    title: 'Dark Mode Support',
    description: 'Please add dark mode to the application',
    rating: 5,
    status: 'open',
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-01-20T09:00:00Z'
  },
  {
    feedback_id: 'fb-002',
    user_id: 'user-002',
    type: 'bug_report',
    title: 'Login Issue',
    description: 'Users cannot login with Google OAuth',
    rating: 2,
    status: 'in_progress',
    created_at: '2024-01-21T10:00:00Z',
    updated_at: '2024-01-21T10:00:00Z'
  }
];

const sampleOrders = [
  {
    order_id: 'order-001',
    customer_id: 'cust-001',
    items: [
      { product_id: 'prod-001', name: 'Premium Widget', quantity: 2, price: 29.99 },
      { product_id: 'prod-002', name: 'Standard Widget', quantity: 1, price: 19.99 }
    ],
    total_amount: 79.97,
    status: 'completed',
    order_date: '2024-01-18T14:00:00Z',
    created_at: '2024-01-18T14:00:00Z',
    updated_at: '2024-01-18T14:00:00Z'
  },
  {
    order_id: 'order-002',
    customer_id: 'cust-002',
    items: [
      { product_id: 'prod-003', name: 'Basic Widget', quantity: 1, price: 9.99 }
    ],
    total_amount: 9.99,
    status: 'pending',
    order_date: '2024-01-19T15:00:00Z',
    created_at: '2024-01-19T15:00:00Z',
    updated_at: '2024-01-19T15:00:00Z'
  }
];

const sampleAnalytics = [
  {
    metric_id: 'metric-001',
    metric_type: 'page_views',
    value: 1250,
    metadata: { page: '/dashboard', user_type: 'authenticated' },
    timestamp: '2024-01-20T00:00:00Z',
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    metric_id: 'metric-002',
    metric_type: 'user_signups',
    value: 45,
    metadata: { source: 'organic', campaign: 'none' },
    timestamp: '2024-01-20T00:00:00Z',
    created_at: '2024-01-20T00:00:00Z'
  }
];

class DynamoDBSeeder {
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

  async seedCustomers() {
    console.log('🌱 Seeding customers table...');
    
    try {
      for (const customer of sampleCustomers) {
        await this.docClient.send(new PutCommand({
          TableName: this.getTableName('customers'),
          Item: customer
        }));
        console.log(`✅ Added customer: ${customer.first_name} ${customer.last_name}`);
      }
      console.log('✅ Customers seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding customers:', error);
    }
  }

  async seedUsers() {
    console.log('🌱 Seeding users table...');
    
    try {
      for (const user of sampleUsers) {
        await this.docClient.send(new PutCommand({
          TableName: this.getTableName('users'),
          Item: user
        }));
        console.log(`✅ Added user: ${user.first_name} ${user.last_name}`);
      }
      console.log('✅ Users seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding users:', error);
    }
  }

  async seedFeedback() {
    console.log('🌱 Seeding feedback table...');
    
    try {
      for (const feedback of sampleFeedback) {
        await this.docClient.send(new PutCommand({
          TableName: this.getTableName('feedback'),
          Item: feedback
        }));
        console.log(`✅ Added feedback: ${feedback.title}`);
      }
      console.log('✅ Feedback seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding feedback:', error);
    }
  }

  async seedOrders() {
    console.log('🌱 Seeding orders table...');
    
    try {
      for (const order of sampleOrders) {
        await this.docClient.send(new PutCommand({
          TableName: this.getTableName('orders'),
          Item: order
        }));
        console.log(`✅ Added order: ${order.order_id}`);
      }
      console.log('✅ Orders seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding orders:', error);
    }
  }

  async seedAnalytics() {
    console.log('🌱 Seeding analytics table...');
    
    try {
      for (const metric of sampleAnalytics) {
        await this.docClient.send(new PutCommand({
          TableName: this.getTableName('analytics'),
          Item: metric
        }));
        console.log(`✅ Added metric: ${metric.metric_type}`);
      }
      console.log('✅ Analytics seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding analytics:', error);
    }
  }

  async seedAll() {
    console.log('🚀 Starting DynamoDB seeding process...');
    console.log(`🌍 Environment: ${this.environment}`);
    console.log('=====================================');
    
    await this.seedCustomers();
    await this.seedUsers();
    await this.seedFeedback();
    await this.seedOrders();
    await this.seedAnalytics();
    
    console.log('=====================================');
    console.log('🎉 All tables seeded successfully!');
  }
}

// Run the seeder if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new DynamoDBSeeder();
  seeder.seedAll().catch(console.error);
}

export default DynamoDBSeeder;

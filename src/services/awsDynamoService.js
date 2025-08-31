// AWS DynamoDB Service using AWS SDK v3
// This service provides direct access to DynamoDB tables

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { AWS_CONFIG, ENVIRONMENT } from '../config/aws-config.js';

class AWSDynamoService {
  constructor() {
    this.client = new DynamoDBClient(AWS_CONFIG);
    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.environment = ENVIRONMENT;
  }

  // Helper method to get table name with environment prefix
  getTableName(baseName) {
    return `${this.environment}-${baseName}`;
  }

  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== CUSTOMERS TABLE OPERATIONS =====
  
  async createCustomer(customerData) {
    const customer = {
      customer_id: customerData.customer_id || this.generateId(),
      first_name: customerData.first_name,
      last_name: customerData.last_name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      status: customerData.status || 'active',
      subscription_tier: customerData.subscription_tier || 'basic',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...customerData
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.getTableName('customers'),
        Item: customer
      }));
      
      return { success: true, customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: error.message };
    }
  }

  async getCustomer(customerId) {
    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.getTableName('customers'),
        Key: { customer_id: customerId }
      }));
      
      return { success: true, customer: result.Item };
    } catch (error) {
      console.error('Error getting customer:', error);
      return { success: false, error: error.message };
    }
  }

  async getCustomerByEmail(email) {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.getTableName('customers'),
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      }));
      
      return { success: true, customers: result.Items };
    } catch (error) {
      console.error('Error getting customer by email:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCustomer(customerId, updates) {
    try {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach(key => {
        if (key !== 'customer_id') {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = updates[key];
        }
      });

      updateExpression.push('#updated_at = :updated_at');
      expressionAttributeNames['#updated_at'] = 'updated_at';
      expressionAttributeValues[':updated_at'] = new Date().toISOString();

      const result = await this.docClient.send(new UpdateCommand({
        TableName: this.getTableName('customers'),
        Key: { customer_id: customerId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));
      
      return { success: true, customer: result.Attributes };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteCustomer(customerId) {
    try {
      await this.docClient.send(new DeleteCommand({
        TableName: this.getTableName('customers'),
        Key: { customer_id: customerId }
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: error.message };
    }
  }

  async listCustomers(limit = 100, lastEvaluatedKey = null) {
    try {
      const params = {
        TableName: this.getTableName('customers'),
        Limit: limit
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await this.docClient.send(new ScanCommand(params));
      
      return { 
        success: true, 
        customers: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      console.error('Error listing customers:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== USERS TABLE OPERATIONS =====
  
  async createUser(userData) {
    const user = {
      user_id: userData.user_id || this.generateId(),
      email: userData.email,
      password_hash: userData.password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role || 'user',
      status: userData.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.getTableName('users'),
        Item: user
      }));
      
      return { success: true, user };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId) {
    try {
      await this.docClient.send(new DeleteCommand({
        TableName: this.getTableName('users'),
        Key: { user_id: userId }
      }));
      
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  async scanTable(tableName, limit = 100) {
    try {
      const result = await this.docClient.send(new ScanCommand({
        TableName: this.getTableName(tableName),
        Limit: limit
      }));
      
      return { success: true, items: result.Items || [] };
    } catch (error) {
      console.error(`Error scanning ${tableName} table:`, error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userId) {
    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.getTableName('users'),
        Key: { user_id: userId }
      }));
      
      return { success: true, user: result.Item };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserByEmail(email) {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.getTableName('users'),
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      }));
      
      return { success: true, users: result.Items };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updates) {
    try {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach(key => {
        if (key !== 'user_id') {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = updates[key];
        }
      });

      updateExpression.push('#updated_at = :updated_at');
      expressionAttributeNames['#updated_at'] = 'updated_at';
      expressionAttributeValues[':updated_at'] = new Date().toISOString();

      const result = await this.docClient.send(new UpdateCommand({
        TableName: this.getTableName('users'),
        Key: { user_id: userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));
      
      return { success: true, user: result.Attributes };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== FEEDBACK TABLE OPERATIONS =====
  
  async createFeedback(feedbackData) {
    const feedback = {
      feedback_id: feedbackData.feedback_id || this.generateId(),
      user_id: feedbackData.user_id,
      type: feedbackData.type || 'general',
      title: feedbackData.title,
      description: feedbackData.description,
      rating: feedbackData.rating,
      status: feedbackData.status || 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...feedbackData
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.getTableName('feedback'),
        Item: feedback
      }));
      
      return { success: true, feedback };
    } catch (error) {
      console.error('Error creating feedback:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserFeedback(userId, limit = 50) {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.getTableName('feedback'),
        IndexName: 'UserFeedbackIndex',
        KeyConditionExpression: 'user_id = :user_id',
        ExpressionAttributeValues: { ':user_id': userId },
        ScanIndexForward: false, // Most recent first
        Limit: limit
      }));
      
      return { success: true, feedback: result.Items };
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== ORDERS TABLE OPERATIONS =====
  
  async createOrder(orderData) {
    const order = {
      order_id: orderData.order_id || this.generateId(),
      customer_id: orderData.customer_id,
      items: orderData.items || [],
      total_amount: orderData.total_amount,
      status: orderData.status || 'pending',
      order_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...orderData
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.getTableName('orders'),
        Item: order
      }));
      
      return { success: true, order };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  async getCustomerOrders(customerId, limit = 50) {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.getTableName('orders'),
        IndexName: 'CustomerOrdersIndex',
        KeyConditionExpression: 'customer_id = :customer_id',
        ExpressionAttributeValues: { ':customer_id': customerId },
        ScanIndexForward: false, // Most recent first
        Limit: limit
      }));
      
      return { success: true, orders: result.Items };
    } catch (error) {
      console.error('Error getting customer orders:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== ANALYTICS TABLE OPERATIONS =====
  
  async recordMetric(metricData) {
    const metric = {
      metric_id: metricData.metric_id || this.generateId(),
      metric_type: metricData.metric_type,
      value: metricData.value,
      metadata: metricData.metadata || {},
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...metricData
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.getTableName('analytics'),
        Item: metric
      }));
      
      return { success: true, metric };
    } catch (error) {
      console.error('Error recording metric:', error);
      return { success: false, error: error.message };
    }
  }

  async getMetricsByType(metricType, limit = 100) {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.getTableName('analytics'),
        IndexName: 'MetricTypeIndex',
        KeyConditionExpression: 'metric_type = :metric_type',
        ExpressionAttributeValues: { ':metric_type': metricType },
        ScanIndexForward: false, // Most recent first
        Limit: limit
      }));
      
      return { success: true, metrics: result.Items };
    } catch (error) {
      console.error('Error getting metrics by type:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== BATCH OPERATIONS =====
  
  async batchGetCustomers(customerIds) {
    try {
      const result = await this.docClient.send(new BatchGetCommand({
        RequestItems: {
          [this.getTableName('customers')]: {
            Keys: customerIds.map(id => ({ customer_id: id }))
          }
        }
      }));
      
      return { success: true, customers: result.Responses[this.getTableName('customers')] };
    } catch (error) {
      console.error('Error batch getting customers:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== UTILITY METHODS =====
  
  async getTableInfo(tableName) {
    try {
      const result = await this.client.send(new DescribeTableCommand({
        TableName: this.getTableName(tableName)
      }));
      
      return { success: true, table: result.Table };
    } catch (error) {
      console.error('Error getting table info:', error);
      return { success: false, error: error.message };
    }
  }

  async healthCheck() {
    try {
      // Try to scan one item from customers table
      await this.docClient.send(new ScanCommand({
        TableName: this.getTableName('customers'),
        Limit: 1
      }));
      
      return { success: true, status: 'healthy' };
    } catch (error) {
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }
}

export default new AWSDynamoService();

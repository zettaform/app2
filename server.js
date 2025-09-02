import express from 'express';
import cors from 'cors';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand, QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { ENV_CONFIG, ENV_VALIDATION, getTableName } from './src/config/environment.js';

// Load environment variables
dotenv.config();

// Validate environment configuration
if (!ENV_VALIDATION.isValid) {
  console.error('❌ Environment validation failed. Please check your configuration.');
  console.error('Errors:', ENV_VALIDATION.errors);
  if (ENV_VALIDATION.warnings.length > 0) {
    console.warn('Warnings:', ENV_VALIDATION.warnings);
  }
  
  // In production, continue with warnings but log the issues
  if (ENV_CONFIG.NODE_ENV === 'production') {
    console.warn('⚠️ Continuing in production mode despite validation errors...');
  } else {
    console.error('❌ Exiting due to validation errors in non-production environment.');
    process.exit(1);
  }
}

const app = express();
const PORT = ENV_CONFIG.PORT;
const ENVIRONMENT = ENV_CONFIG.ENVIRONMENT;

// Enhanced CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ENV_CONFIG.CORS.ORIGIN;
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-api-key'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: ENV_CONFIG.PERFORMANCE.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: ENV_CONFIG.PERFORMANCE.MAX_REQUEST_SIZE }));

// Request timeout middleware
app.use((req, res, next) => {
  const timeout = ENV_CONFIG.PERFORMANCE.REQUEST_TIMEOUT;
  req.setTimeout(timeout, () => {
    res.status(408).json({ success: false, error: 'Request timeout' });
  });
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// AWS Configuration
const awsConfig = {
  region: ENV_CONFIG.AWS.REGION,
  credentials: {
    accessKeyId: ENV_CONFIG.AWS.ACCESS_KEY_ID,
    secretAccessKey: ENV_CONFIG.AWS.SECRET_ACCESS_KEY
  }
};

const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper function to get table name (now imported from environment config)

// Enhanced password hashing with salt
const hashPassword = (password) => {
  const salt = ENV_CONFIG.SECURITY.PASSWORD_SALT;
  return Buffer.from(password + salt).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
};

// JWT secret validation (now handled in environment config)
const JWT_SECRET = ENV_CONFIG.SECURITY.JWT_SECRET;

// Log external user creation
const logExternalUserCreation = async (userData, adminKeyInfo, success, error = null) => {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const logItem = {
      log_id: logId,
      admin_key_id: adminKeyInfo?.admin_key_id || 'legacy_key',
      admin_key: adminKeyInfo?.admin_key || 'legacy_key',
      user_email: userData.email,
      user_first_name: userData.first_name,
      user_last_name: userData.last_name,
      user_role: userData.role,
      user_status: userData.status,
      success: success,
      error_message: error,
      ip_address: 'N/A', // Could be enhanced with real IP tracking
      user_agent: 'N/A', // Could be enhanced with real user agent
      created_at: timestamp,
      expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year TTL
      metadata: {
        environment: ENVIRONMENT,
        timestamp: timestamp,
        admin_key_description: adminKeyInfo?.description || 'Legacy Admin Key',
        admin_key_usage_before: adminKeyInfo?.users_created || 0,
        admin_key_usage_after: (adminKeyInfo?.users_created || 0) + 1
      }
    };
    
    const putCommand = new PutCommand({
      TableName: EXTERNAL_USER_LOGS_TABLE,
      Item: logItem
    });
    
    await docClient.send(putCommand);
    console.log(`✅ External user creation logged: ${logId}`);
  } catch (err) {
    console.error('❌ Error logging external user creation:', err);
    // Don't fail the main operation if logging fails
  }
};

// Admin keys table configuration
const ADMIN_KEYS_TABLE = ENV_CONFIG.TABLES.ADMIN_KEYS;
const EXTERNAL_USER_LOGS_TABLE = ENV_CONFIG.TABLES.EXTERNAL_LOGS;

// Legacy admin key for backward compatibility
const ADMIN_GLOBAL_KEY = ENV_CONFIG.SECURITY.ADMIN_GLOBAL_KEY;

// Middleware to check admin global key
const validateAdminKey = async (req, res, next) => {
  try {
    // Check headers first (for POST requests)
    let adminKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    // If not in headers, check query parameters (for GET requests)
    if (!adminKey && req.method === 'GET') {
      adminKey = req.query['x-admin-key'] || req.query['admin_key'];
    }
    
    if (!adminKey) {
      return res.status(401).json({
        success: false,
        error: 'Missing admin key',
        usage: req.method === 'GET' 
          ? 'Add ?x-admin-key=<your_key> to your URL'
          : 'Include x-admin-key header or Authorization: Bearer <key>'
      });
    }
    
    // First check legacy key for backward compatibility
    if (adminKey === ADMIN_GLOBAL_KEY) {
      return next();
    }
    
    // Check admin key in DynamoDB table
    try {
      const queryCommand = new QueryCommand({
        TableName: ADMIN_KEYS_TABLE,
        IndexName: 'AdminKeyIndex',
        KeyConditionExpression: 'admin_key = :key',
        ExpressionAttributeValues: { ':key': adminKey }
      });
      
      const result = await docClient.send(queryCommand);
      
      if (!result.Items || result.Items.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid admin key',
          usage: req.method === 'GET' 
            ? 'Add ?x-admin-key=<your_key> to your URL'
            : 'Include x-admin-key header or Authorization: Bearer <key>'
        });
      }
      
      const keyInfo = result.Items[0];
      
      // Check if key is active
      if (keyInfo.key_status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Admin key is inactive',
          details: `Key status: ${keyInfo.key_status}`
        });
      }
      
      // Check if key has expired
      if (keyInfo.expires_at && keyInfo.expires_at < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          success: false,
          error: 'Admin key has expired',
          details: `Expired at: ${new Date(keyInfo.expires_at * 1000).toISOString()}`
        });
      }
      
      // Check user creation limit
      if (keyInfo.users_created >= keyInfo.user_creation_limit) {
        return res.status(429).json({
          success: false,
          error: 'User creation limit reached',
          details: {
            users_created: keyInfo.users_created,
            user_creation_limit: keyInfo.user_creation_limit,
            remaining: 0
          }
        });
      }
      
      // Store key info in request for later use
      req.adminKeyInfo = keyInfo;
      
      next();
    } catch (dbError) {
      console.error('Error validating admin key:', dbError);
      // Fallback to legacy key validation
      if (adminKey === ADMIN_GLOBAL_KEY) {
        return next();
      }
      return res.status(500).json({
        success: false,
        error: 'Error validating admin key'
      });
    }
  } catch (error) {
    console.error('Error in validateAdminKey middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Routes

// List all users
app.get('/api/users', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: getTableName('users'),
      Limit: 100
    });

    const result = await docClient.send(command);
    
    res.json({
      success: true,
      users: result.Items || []
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create user (internal - requires session auth)
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, status, avatar } = req.body;
    
    const userId = `user-${role}-${Date.now()}`;
    const now = new Date().toISOString();
    
    const user = {
      user_id: userId,
      first_name,
      last_name,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      role,
      status,
      avatar,
      created_at: now,
      updated_at: now,
      last_login: null
    };

    const command = new PutCommand({
      TableName: getTableName('users'),
      Item: user
    });

    await docClient.send(command);
    
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create user externally (requires admin global key)
app.post('/api/external/users', validateAdminKey, async (req, res) => {
  try {
    const { first_name, last_name, email, password, role = 'user', status = 'active', avatar } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: first_name, last_name, email, password'
      });
    }
    
    // Check if user already exists
    const queryCommand = new QueryCommand({
      TableName: getTableName('users'),
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() }
    });

    const existingUser = await docClient.send(queryCommand);
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    const userId = `user-${role}-${Date.now()}`;
    const now = new Date().toISOString();
    
    const user = {
      user_id: userId,
      first_name,
      last_name,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      role,
      status,
      avatar,
      created_at: now,
      updated_at: now,
      last_login: null
    };

    const command = new PutCommand({
      TableName: getTableName('users'),
      Item: user
    });

            await docClient.send(command);
        
        // Increment usage counter for the admin key if it's not the legacy key
        if (req.adminKeyInfo && req.adminKeyInfo.admin_key !== ADMIN_GLOBAL_KEY) {
          try {
            const updateCommand = new UpdateCommand({
              TableName: ADMIN_KEYS_TABLE,
              Key: { admin_key_id: req.adminKeyInfo.admin_key_id },
              UpdateExpression: 'SET users_created = users_created + :inc, updated_at = :updated_at',
              ExpressionAttributeValues: {
                ':inc': 1,
                ':updated_at': new Date().toISOString()
              }
            });
            
            await docClient.send(updateCommand);
          } catch (updateError) {
            console.error('Error updating admin key usage:', updateError);
            // Don't fail the user creation if usage tracking fails
          }
        }
        
        // Log the successful user creation
        await logExternalUserCreation(
          { first_name, last_name, email, role, status },
          req.adminKeyInfo,
          true
        );
        
        // Return user without password hash
        const { password_hash, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          user: userWithoutPassword,
          message: 'User created successfully via external API',
          admin_key_info: req.adminKeyInfo ? {
            key_id: req.adminKeyInfo.admin_key_id,
            users_created: req.adminKeyInfo.users_created + 1,
            user_creation_limit: req.adminKeyInfo.user_creation_limit,
            remaining: req.adminKeyInfo.user_creation_limit - (req.adminKeyInfo.users_created + 1)
          } : null
        });
  } catch (error) {
    console.error('Error creating external user:', error);
    
    // Log the failed user creation attempt
    try {
      await logExternalUserCreation(
        { first_name, last_name, email, role, status },
        req.adminKeyInfo,
        false,
        error.message
      );
    } catch (logError) {
      console.error('Error logging failed user creation:', logError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create user externally (requires admin key) - GET method for browser access
app.get('/api/external/users', validateAdminKey, async (req, res) => {
  try {
    const { first_name, last_name, email, password, role = 'user', status = 'active', avatar } = req.query;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: first_name, last_name, email, password',
        usage: 'GET /api/external/users?first_name=John&last_name=Doe&email=john@example.com&password=password123&role=user&status=active&avatar=goku&x-admin-key=admin_global_key_2024_secure_123'
      });
    }
    
    // Check if user already exists
    const queryCommand = new QueryCommand({
      TableName: getTableName('users'),
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() }
    });

    const existingUser = await docClient.send(queryCommand);
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        existingUser: {
          user_id: existingUser.Items[0].user_id,
          email: existingUser.Items[0].email,
          status: existingUser.Items[0].status
        }
      });
    }
    
    const userId = `user-${role}-${Date.now()}`;
    const now = new Date().toISOString();
    
    const user = {
      user_id: userId,
      first_name,
      last_name,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      role,
      status,
      avatar,
      created_at: now,
      updated_at: now,
      last_login: null
    };

    const command = new PutCommand({
      TableName: getTableName('users'),
      Item: user
    });

            await docClient.send(command);
        
        // Increment usage counter for the admin key if it's not the legacy key
        if (req.adminKeyInfo && req.adminKeyInfo.admin_key !== ADMIN_GLOBAL_KEY) {
          try {
            const updateCommand = new UpdateCommand({
              TableName: ADMIN_KEYS_TABLE,
              Key: { admin_key_id: req.adminKeyInfo.admin_key_id },
              UpdateExpression: 'SET users_created = users_created + :inc, updated_at = :updated_at',
              ExpressionAttributeValues: {
                ':inc': 1,
                ':updated_at': new Date().toISOString()
              }
            });
            
            await docClient.send(updateCommand);
          } catch (updateError) {
            console.error('Error updating admin key usage:', updateError);
            // Don't fail the user creation if usage tracking fails
          }
        }
        
        // Log the successful user creation
        await logExternalUserCreation(
          { first_name, last_name, email, role, status },
          req.adminKeyInfo,
          true
        );
        
        // Return user without password hash
        const { password_hash, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          user: userWithoutPassword,
          message: 'User created successfully via GET API',
          method: 'GET',
          url: req.originalUrl,
          admin_key_info: req.adminKeyInfo ? {
            key_id: req.adminKeyInfo.admin_key_id,
            users_created: req.adminKeyInfo.users_created + 1,
            user_creation_limit: req.adminKeyInfo.user_creation_limit,
            remaining: req.adminKeyInfo.user_creation_limit - (req.adminKeyInfo.users_created + 1)
          } : null
        });
  } catch (error) {
    console.error('Error creating external user via GET:', error);
    
    // Log the failed user creation attempt
    try {
      await logExternalUserCreation(
        { first_name, last_name, email, role, status },
        req.adminKeyInfo,
        false,
        error.message
      );
    } catch (logError) {
      console.error('Error logging failed user creation:', logError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Build update expression
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

    // Always update the updated_at timestamp
    updateExpression.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: getTableName('users'),
      Key: { user_id: userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    
    res.json({
      success: true,
      user: result.Attributes
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const command = new DeleteCommand({
      TableName: getTableName('users'),
      Key: { user_id: userId }
    });

    await docClient.send(command);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Request password reset
app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Get user by email
    const queryCommand = new QueryCommand({
      TableName: getTableName('users'),
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    });

    const result = await docClient.send(queryCommand);
    
    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }

    // Generate reset token (simple implementation for demo)
    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store reset token in analytics table
    const resetCommand = new PutCommand({
      TableName: getTableName('analytics'),
      Item: {
        metric_id: resetToken,
        metric_type: 'password_reset',
        value: 1,
        metadata: {
          user_id: result.Items[0].user_id,
          email: result.Items[0].email,
          reset_token: resetToken,
          expires_at: resetExpires,
          is_used: false
        },
        created_at: new Date().toISOString()
      }
    });

    await docClient.send(resetCommand);
    
    // In a real app, you'd send an email here
    // For demo purposes, we'll just return success
    res.json({ 
      success: true, 
      message: 'Password reset link sent to your email',
      resetToken: resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Track user login
app.post('/api/users/:userId/login', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: getTableName('users'),
      Key: { user_id: userId },
      UpdateExpression: 'SET last_login = :last_login, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':last_login': now,
        ':updated_at': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    
    res.json({
      success: true,
      user: result.Attributes
    });
  } catch (error) {
    console.error('Error tracking user login:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all DynamoDB tables
app.get('/api/tables', async (req, res) => {
  try {
    const { ListTablesCommand, DescribeTableCommand, ScanCommand } = await import('@aws-sdk/client-dynamodb');
    
    const command = new ListTablesCommand({});
    const result = await dynamoClient.send(command);
    
    // Show all tables, not just environment-prefixed ones
    const allTables = result.TableNames;

    // Get details for each table
    const tablesWithDetails = await Promise.all(
      allTables.map(async (tableName) => {
        try {
          // Get table description
          const describeCommand = new DescribeTableCommand({ TableName: tableName });
          const describeResult = await dynamoClient.send(describeCommand);
          
          // Get record count
          const scanCommand = new ScanCommand({ 
            TableName: tableName,
            Select: 'COUNT'
          });
          const scanResult = await docClient.send(scanCommand);
          
          return {
            name: tableName,
            displayName: tableName.startsWith(`${ENVIRONMENT}-`) ? tableName.replace(`${ENVIRONMENT}-`, '') : tableName,
            recordCount: scanResult.Count || 0,
            sizeBytes: describeResult.Table.TableSizeBytes || 0,
            status: describeResult.Table.TableStatus,
            itemCount: describeResult.Table.ItemCount || 0,
            createdAt: describeResult.Table.CreationDateTime,
            keySchema: describeResult.Table.KeySchema,
            attributes: describeResult.Table.AttributeDefinitions || [],
            indexes: describeResult.Table.GlobalSecondaryIndexes || [],
            billingMode: describeResult.Table.BillingModeSummary?.BillingMode || 'PROVISIONED',
            readCapacity: describeResult.Table.ProvisionedThroughput?.ReadCapacityUnits,
            writeCapacity: describeResult.Table.ProvisionedThroughput?.WriteCapacityUnits
          };
        } catch (err) {
          console.error(`Error fetching details for table ${tableName}:`, err);
          return {
            name: tableName,
            displayName: tableName.startsWith(`${ENVIRONMENT}-`) ? tableName.replace(`${ENVIRONMENT}-`, '') : tableName,
            recordCount: 'Error',
            sizeBytes: 0,
            status: 'Unknown',
            itemCount: 0,
            createdAt: null,
            keySchema: [],
            attributes: [],
            indexes: [],
            billingMode: 'Unknown',
            readCapacity: null,
            writeCapacity: null
          };
        }
      })
    );
    
    res.json({
      success: true,
      tables: tablesWithDetails,
      total: tablesWithDetails.length,
      environment: ENVIRONMENT
    });
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scan table contents with pagination
app.get('/api/tables/:tableName/scan', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 50, lastKey, filter } = req.query;
    
    const { ScanCommand } = await import('@aws-sdk/client-dynamodb');
    
    const scanParams = {
      TableName: tableName,
      Limit: parseInt(limit),
      ...(lastKey && { ExclusiveStartKey: JSON.parse(lastKey) })
    };

    // Add filter if provided
    if (filter) {
      try {
        const filterObj = JSON.parse(filter);
        if (filterObj.expression && filterObj.values) {
          scanParams.FilterExpression = filterObj.expression;
          scanParams.ExpressionAttributeValues = filterObj.values;
        }
      } catch (e) {
        console.warn('Invalid filter format:', e);
      }
    }

    const command = new ScanCommand(scanParams);
    const result = await docClient.send(command);
    
    res.json({
      success: true,
      items: result.Items || [],
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
      lastEvaluatedKey: result.LastEvaluatedKey,
      hasMore: !!result.LastEvaluatedKey
    });
  } catch (error) {
    console.error('Error scanning table:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get admin key info (for development purposes)
app.get('/api/admin/key-info', (req, res) => {
  res.json({
    success: true,
    message: 'Admin global key is configured',
    usage: {
      post: 'Include in headers: x-admin-key or Authorization: Bearer <key>',
      get: 'Add to URL: ?x-admin-key=admin_global_key_2024_secure_123'
    },
    endpoints: [
      'POST /api/external/users - Create user with admin key in headers',
      'GET  /api/external/users - Create user with admin key in URL'
    ],
    examples: {
      post: 'POST /api/external/users with x-admin-key header',
      get: 'GET /api/external/users?first_name=John&last_name=Doe&email=john@example.com&password=password123&x-admin-key=admin_global_key_2024_secure_123'
    }
  });
});

// Admin Keys Management API
// List all admin keys (admin only)
app.get('/api/admin/keys', async (req, res) => {
  try {
    const scanCommand = new ScanCommand({
      TableName: ADMIN_KEYS_TABLE,
      ProjectionExpression: 'admin_key_id, admin_key, user_creation_limit, users_created, description, key_status, created_at, expires_at'
    });
    
    const result = await docClient.send(scanCommand);
    
    res.json({
      success: true,
      admin_keys: result.Items || [],
      total: result.Items ? result.Items.length : 0
    });
  } catch (error) {
    console.error('Error listing admin keys:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new admin key (admin only)
app.post('/api/admin/keys', async (req, res) => {
  try {
    const { user_creation_limit, description, expires_in_days = 365 } = req.body;
    
    if (!user_creation_limit || user_creation_limit <= 0) {
      return res.status(400).json({
        success: false,
        error: 'user_creation_limit is required and must be greater than 0'
      });
    }
    
    // Generate secure admin key
    const adminKey = `admin_key_${crypto.randomBytes(16).toString('hex')}`;
    const adminKeyId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (expires_in_days * 24 * 60 * 60 * 1000));
    
    const adminKeyItem = {
      admin_key_id: adminKeyId,
      admin_key: adminKey,
      user_creation_limit: parseInt(user_creation_limit),
      users_created: 0,
      description: description || '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      key_status: 'active',
      created_by: 'admin'
    };
    
    const command = new PutCommand({
      TableName: ADMIN_KEYS_TABLE,
      Item: adminKeyItem
    });
    
    await docClient.send(command);
    
    res.json({
      success: true,
      admin_key: adminKeyItem,
      message: 'Admin key created successfully'
    });
  } catch (error) {
    console.error('Error creating admin key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update admin key (admin only)
app.put('/api/admin/keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { user_creation_limit, description, key_status, expires_in_days } = req.body;
    
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    if (user_creation_limit !== undefined) {
      updateExpression.push('#user_creation_limit = :user_creation_limit');
      expressionAttributeNames['#user_creation_limit'] = 'user_creation_limit';
      expressionAttributeValues[':user_creation_limit'] = parseInt(user_creation_limit);
    }
    
    if (description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }
    
    if (key_status !== undefined) {
      updateExpression.push('#key_status = :key_status');
      expressionAttributeNames['#key_status'] = 'key_status';
      expressionAttributeValues[':key_status'] = key_status;
    }
    
    if (expires_in_days !== undefined) {
      const expiresAt = new Date(Date.now() + (expires_in_days * 24 * 60 * 60 * 1000));
      updateExpression.push('#expires_at = :expires_at');
      expressionAttributeNames['#expires_at'] = 'expires_at';
      expressionAttributeValues[':expires_at'] = Math.floor(expiresAt.getTime() / 1000);
    }
    
    updateExpression.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: ADMIN_KEYS_TABLE,
      Key: { admin_key_id: keyId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await docClient.send(command);
    
    res.json({
      success: true,
      admin_key: result.Attributes,
      message: 'Admin key updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Query external user creation logs
app.get('/api/admin/logs', async (req, res) => {
  try {
    const { admin_key, admin_key_id, start_date, end_date, success, limit = 100, last_key } = req.query;
    
    // Build query parameters
    const queryParams = {
      TableName: EXTERNAL_USER_LOGS_TABLE,
      Limit: parseInt(limit),
      ScanIndexForward: false, // Most recent first
      ...(last_key && { ExclusiveStartKey: JSON.parse(last_key) })
    };
    
    let queryCommand;
    
    if (admin_key) {
      // Query by admin key
      queryCommand = new QueryCommand({
        ...queryParams,
        IndexName: 'AdminKeyIndex',
        KeyConditionExpression: 'admin_key = :admin_key',
        ExpressionAttributeValues: { ':admin_key': admin_key }
      });
    } else if (admin_key_id) {
      // Query by admin key ID
      queryCommand = new QueryCommand({
        ...queryParams,
        IndexName: 'AdminKeyIdIndex',
        KeyConditionExpression: 'admin_key_id = :admin_key_id',
        ExpressionAttributeValues: { ':admin_key_id': admin_key_id }
      });
    } else {
      // Scan all logs with optional filters
      const scanParams = {
        ...queryParams,
        FilterExpression: [],
        ExpressionAttributeValues: {},
        ExpressionAttributeNames: {}
      };
      
      if (start_date) {
        scanParams.FilterExpression.push('#created_at >= :start_date');
        scanParams.ExpressionAttributeValues[':start_date'] = start_date;
        scanParams.ExpressionAttributeNames['#created_at'] = 'created_at';
      }
      
      if (end_date) {
        scanParams.FilterExpression.push('#created_at <= :end_date');
        scanParams.ExpressionAttributeValues[':end_date'] = end_date;
        scanParams.ExpressionAttributeNames[':end_date'] = 'end_date';
      }
      
      if (success !== undefined) {
        scanParams.FilterExpression.push('#success = :success');
        scanParams.ExpressionAttributeValues[':success'] = success === 'true';
        scanParams.ExpressionAttributeNames['#success'] = 'success';
      }
      
      if (scanParams.FilterExpression.length > 0) {
        scanParams.FilterExpression = scanParams.FilterExpression.join(' AND ');
      } else {
        delete scanParams.FilterExpression;
        delete scanParams.ExpressionAttributeValues;
        delete scanParams.ExpressionAttributeNames;
      }
      
      queryCommand = new ScanCommand(scanParams);
    }
    
    const result = await docClient.send(queryCommand);
    
    res.json({
      success: true,
      logs: result.Items || [],
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
      lastEvaluatedKey: result.LastEvaluatedKey,
      hasMore: !!result.LastEvaluatedKey
    });
  } catch (error) {
    console.error('Error querying logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete admin key (admin only)
app.delete('/api/admin/keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    
    const command = new DeleteCommand({
      TableName: ADMIN_KEYS_TABLE,
      Key: { admin_key_id: keyId }
    });
    
    await docClient.send(command);
    
    res.json({
      success: true,
      message: 'Admin key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Hash the provided password
    const hashedPassword = hashPassword(password);
    
    // Find user by email in the dev-users table
    const queryCommand = new QueryCommand({
      TableName: `${ENVIRONMENT}-users`,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    });
    
    const result = await docClient.send(queryCommand);
    
    if (!result.Items || result.Items.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    const user = result.Items[0];
    
    // Check if password matches
    if (user.password_hash !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }
    
    // Create session token (simple JWT-like token for demo)
    const sessionToken = Buffer.from(`${user.user_id}:${Date.now()}:${Math.random()}`).toString('base64');
    
    // Update last login
    const updateCommand = new UpdateCommand({
      TableName: `${ENVIRONMENT}-users`,
      Key: { user_id: user.user_id },
      UpdateExpression: 'SET last_login = :last_login, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':last_login': new Date().toISOString(),
        ':updated_at': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });
    
    await docClient.send(updateCommand);
    
    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      sessionToken,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get current user by session token
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }
    
    const sessionToken = authHeader.replace('Bearer ', '');
    
    // Decode session token to get user ID
    const decoded = Buffer.from(sessionToken, 'base64').toString();
    const [userId] = decoded.split(':');
    
    // Get user from database
    const getCommand = new GetCommand({
      TableName: `${ENVIRONMENT}-users`,
      Key: { user_id: userId }
    });
    
    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is active
    if (result.Item.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }
    
    // Return user data without password
    const { password_hash, ...userWithoutPassword } = result.Item;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current user'
    });
  }
});

// Feedback API endpoints
app.post('/api/feedback', async (req, res) => {
  try {
    const { user_id, username, email, rating, message, created_at, status } = req.body;
    
    // Validate required fields
    if (!rating || !message || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Rating, message, and user_id are required'
      });
    }
    
    // Create feedback item
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const feedbackItem = {
      feedback_id: feedbackId,
      user_id: user_id,
      username: username || 'Anonymous',
      email: email || 'anonymous@example.com',
      rating: Number(rating),
      message: message.trim(),
      created_at: created_at || new Date().toISOString(),
      status: status || 'active',
      expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year TTL
      metadata: {
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
        source: 'web_feedback_form'
      }
    };
    
    // Store in DynamoDB
    const putCommand = new PutCommand({
      TableName: `${ENVIRONMENT}-feedback`,
      Item: feedbackItem
    });
    
    await docClient.send(putCommand);
    
    console.log(`✅ Feedback submitted: ${feedbackId}`);
    
    res.json({
      success: true,
      feedback_id: feedbackId,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get feedback for admin users
app.get('/api/feedback', async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper authentication here)
    const { limit = 50, lastEvaluatedKey } = req.query;
    
    const scanParams = {
      TableName: `${ENVIRONMENT}-feedback`,
      Limit: parseInt(limit),
      ScanIndexForward: false, // Most recent first
    };
    
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }
    
    const scanCommand = new ScanCommand(scanParams);
    const result = await docClient.send(scanCommand);
    
    res.json({
      success: true,
      feedback: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count,
      scannedCount: result.ScannedCount
    });
    
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${ENVIRONMENT}`);
  console.log(`🔧 Node Environment: ${ENV_CONFIG.NODE_ENV}`);
  console.log(`🗄️  AWS Region: ${ENV_CONFIG.AWS.REGION}`);
  console.log(`🔑 Admin Global Key: ${ADMIN_GLOBAL_KEY}`);
  console.log(`📊 DynamoDB Tables:`);
  console.log(`   - Users: ${ENV_CONFIG.TABLES.USERS}`);
  console.log(`   - Admin Keys: ${ENV_CONFIG.TABLES.ADMIN_KEYS}`);
  console.log(`   - External Logs: ${ENV_CONFIG.TABLES.EXTERNAL_LOGS}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/users - List all users`);
  console.log(`   POST /api/users - Create new user (internal)`);
  console.log(`   POST /api/external/users - Create user externally (admin key required)`);
  console.log(`   GET  /api/external/users - Create user via GET (admin key in URL)`);
  console.log(`   PUT  /api/users/:userId - Update user`);
  console.log(`   DELETE /api/users/:userId - Delete user`);
  console.log(`   POST /api/users/:userId/login - Track user login`);
  console.log(`   POST /api/users/reset-password - Request password reset`);
  console.log(`   GET  /api/tables - List all DynamoDB tables with details`);
  console.log(`   GET  /api/tables/:tableName/scan - Scan table contents with pagination`);
  console.log(`   GET  /api/admin/key-info - Get admin key information`);
  console.log(`   GET  /api/admin/keys - List all admin keys`);
  console.log(`   POST /api/admin/keys - Create new admin key`);
  console.log(`   PUT  /api/admin/keys/:keyId - Update admin key`);
  console.log(`   DELETE /api/admin/keys/:keyId - Delete admin key`);
  console.log(`   GET  /api/admin/logs - Query external user creation logs`);
  console.log(`   POST /api/auth/login - User authentication`);
  console.log(`   GET  /api/auth/me - Get current user`);
  console.log(`   POST /api/feedback - Submit user feedback`);
  console.log(`   GET  /api/feedback - Get feedback (admin only)`);
  
  // Log environment validation status
  if (ENV_VALIDATION.isValid) {
    console.log(`✅ Environment validation: PASSED`);
  } else {
    console.log(`❌ Environment validation: FAILED`);
    console.log(`   Errors: ${ENV_VALIDATION.errors.join(', ')}`);
  }
});

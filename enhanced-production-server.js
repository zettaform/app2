import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

// Table name configurations from environment
const TABLES = {
  users: process.env.DDB_USERS_TABLE || 'dev-users',
  customers: process.env.DDB_CUSTOMERS_TABLE || 'dev-users', // Customers page shows users
  feedback: process.env.DDB_FEEDBACK_TABLE || 'dev-feedback',
  orders: process.env.DDB_ORDERS_TABLE || 'dev-orders',
  analytics: process.env.DDB_ANALYTICS_TABLE || 'dev-analytics',
  adminKeys: process.env.DDB_ADMIN_KEYS_TABLE || 'admin-keys-table-admin-keys',
  externalLogs: process.env.DDB_EXTERNAL_LOGS_TABLE || 'dev-external-user-creation-logs'
};

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// JWT secret for production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper function to generate unique IDs
function generateId(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to generate JWT token
function generateJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper function to verify JWT token
function verifyJWT(token) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

// Helper function to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to verify password against base64 encoded hash
function verifyPassword(inputPassword, storedPasswordHash) {
  try {
    // The stored password is base64 encoded with salt
    const decoded = Buffer.from(storedPasswordHash, 'base64').toString('utf-8');
    
    // Check if the decoded string contains the input password
    if (decoded.includes(inputPassword)) {
      return true;
    }
    
    // Also try hashing the input password and comparing
    const hashedInput = hashPassword(inputPassword);
    if (hashedInput === storedPasswordHash) {
      return true;
    }
    
    // Try direct comparison for plain text passwords
    if (inputPassword === storedPasswordHash) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Authentication middleware for JWT verification
function verifyJWTToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyJWT(token);
  
  if (!decoded || !decoded.user_id) {
    return null;
  }
  
  return decoded;
}

// DynamoDB authentication function
async function authenticateUser(email, password) {
  try {
    // Query DynamoDB for user by email using the EmailIndex GSI
    const queryParams = {
      TableName: TABLES.users,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email }
      }
    };
    
    let result = await dynamoClient.send(new QueryCommand(queryParams));
    
    if (!result.Items || result.Items.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const user = unmarshall(result.Items[0]);
    
    // Check if user is disabled/suspended
    if (user.status === 'inactive' || user.status === 'suspended') {
      return { success: false, error: 'Account is disabled or suspended' };
    }
    
    // Verify password - check password_hash field
    const passwordField = user.password_hash;
    if (!passwordField) {
      return { success: false, error: 'Invalid password format' };
    }
    
    if (!verifyPassword(password, passwordField)) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Generate JWT token
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      username: user.email,
      is_superuser: user.role === 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    
    const token = generateJWT(tokenPayload);
    
    // Return user data (exclude sensitive fields)
    const userData = {
      id: user.user_id,
      username: user.email,
      email: user.email,
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      role: user.role || 'user',
      avatar: user.avatar || null,
      status: user.status || 'active'
    };
    
    return {
      success: true,
      message: 'Authentication successful',
      sessionToken: token,
      user: userData
    };
    
  } catch (error) {
    console.error('DynamoDB authentication error:', error);
    return { success: false, error: 'Database error during authentication' };
  }
}

// Get current user function
async function getCurrentUser(userId) {
  try {
    // Try to get user by user_id first
    let getParams = {
      TableName: TABLES.users,
      Key: {
        user_id: { S: userId }
      }
    };
    
    let result = await dynamoClient.send(new GetItemCommand(getParams));
    
    // If not found by user_id, try by email using GSI
    if (!result.Item) {
      const queryParams = {
        TableName: TABLES.users,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': { S: userId }
        }
      };
      result = await dynamoClient.send(new QueryCommand(queryParams));
      if (result.Items && result.Items.length > 0) {
        result.Item = result.Items[0];
      }
    }
    
    if (!result.Item) {
      return { success: false, error: 'User not found' };
    }
    
    const user = unmarshall(result.Item);
    
    // Check if user is disabled/suspended
    if (user.status === 'inactive' || user.status === 'suspended') {
      return { success: false, error: 'Account is disabled or suspended' };
    }
    
    // Return user data (exclude sensitive fields)
    const userData = {
      id: user.user_id,
      username: user.email,
      email: user.email,
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      role: user.role || 'user',
      avatar: user.avatar || null,
      status: user.status || 'active'
    };
    
    return { success: true, user: userData };
    
  } catch (error) {
    console.error('DynamoDB getCurrentUser error:', error);
    return { success: false, error: 'Database error while fetching user' };
  }
}

// Create user function
async function createUser(userData) {
  try {
    // Check if user already exists
    const existingUserQuery = {
      TableName: TABLES.users,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: userData.email }
      }
    };
    
    const existingResult = await dynamoClient.send(new QueryCommand(existingUserQuery));
    
    if (existingResult.Items && existingResult.Items.length > 0) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Create new user
    const userId = generateId('user-');
    const now = new Date().toISOString();
    
    // Hash password
    const passwordHash = Buffer.from(userData.password + 'salt').toString('base64');
    
    const newUser = {
      user_id: userId,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      password_hash: passwordHash,
      role: userData.role || 'user',
      status: userData.status || 'active',
      avatar: userData.avatar || 'goku',
      created_at: now,
      updated_at: now
    };
    
    const putParams = {
      TableName: TABLES.users,
      Item: marshall(newUser)
    };
    
    await dynamoClient.send(new PutItemCommand(putParams));
    
    // Remove password from response
    const { password_hash, ...userResponse } = newUser;
    
    return {
      success: true,
      user: userResponse,
      message: 'User created successfully'
    };
    
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

// Get all users function (for customers page)
async function getAllUsers() {
  try {
    const scanParams = {
      TableName: TABLES.users,
      Limit: 100
    };
    
    const result = await dynamoClient.send(new ScanCommand(scanParams));
    
    if (!result.Items) {
      return { success: true, users: [] };
    }
    
    const users = result.Items.map(item => {
      const user = unmarshall(item);
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return { success: true, users };
    
  } catch (error) {
    console.error('Get all users error:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

// Create feedback function
async function createFeedback(feedbackData) {
  try {
    const feedbackId = generateId('feedback-');
    const now = new Date().toISOString();
    
    const feedback = {
      feedback_id: feedbackId,
      user_id: feedbackData.user_id,
      title: feedbackData.title,
      description: feedbackData.description,
      type: feedbackData.type || 'general',
      rating: feedbackData.rating || 0,
      status: feedbackData.status || 'open',
      created_at: now,
      updated_at: now
    };
    
    const putParams = {
      TableName: TABLES.feedback,
      Item: marshall(feedback)
    };
    
    await dynamoClient.send(new PutItemCommand(putParams));
    
    return {
      success: true,
      feedback,
      message: 'Feedback created successfully'
    };
    
  } catch (error) {
    console.error('Create feedback error:', error);
    return { success: false, error: 'Failed to create feedback' };
  }
}

// Get all feedback function
async function getAllFeedback() {
  try {
    const scanParams = {
      TableName: TABLES.feedback,
      Limit: 100
    };
    
    const result = await dynamoClient.send(new ScanCommand(scanParams));
    
    if (!result.Items) {
      return { success: true, feedback: [] };
    }
    
    const feedback = result.Items.map(item => unmarshall(item));
    
    return { success: true, feedback };
    
  } catch (error) {
    console.error('Get all feedback error:', error);
    return { success: false, error: 'Failed to fetch feedback' };
  }
}

// Get all admin keys function
async function getAllAdminKeys() {
  try {
    const scanParams = {
      TableName: TABLES.adminKeys,
      Limit: 100
    };
    
    const result = await dynamoClient.send(new ScanCommand(scanParams));
    
    if (!result.Items) {
      return { success: true, admin_keys: [] };
    }
    
    const adminKeys = result.Items.map(item => unmarshall(item));
    
    return { success: true, admin_keys: adminKeys };
    
  } catch (error) {
    console.error('Get all admin keys error:', error);
    return { success: false, error: 'Failed to fetch admin keys' };
  }
}

// Get all external user creation logs function
async function getAllExternalLogs(filters = {}) {
  try {
    const scanParams = {
      TableName: TABLES.externalLogs,
      Limit: filters.limit || 100
    };
    
    // Add filters if provided
    if (filters.admin_key) {
      scanParams.FilterExpression = "admin_key = :admin_key";
      scanParams.ExpressionAttributeValues = {
        ":admin_key": { S: filters.admin_key }
      };
    }
    
    if (filters.admin_key_id) {
      if (scanParams.FilterExpression) {
        scanParams.FilterExpression += " AND admin_key_id = :admin_key_id";
      } else {
        scanParams.FilterExpression = "admin_key_id = :admin_key_id";
      }
      scanParams.ExpressionAttributeValues = {
        ...scanParams.ExpressionAttributeValues,
        ":admin_key_id": { S: filters.admin_key_id }
      };
    }
    
    if (filters.success !== undefined && filters.success !== "") {
      if (scanParams.FilterExpression) {
        scanParams.FilterExpression += " AND success = :success";
      } else {
        scanParams.FilterExpression = "success = :success";
      }
      scanParams.ExpressionAttributeValues = {
        ...scanParams.ExpressionAttributeValues,
        ":success": { BOOL: filters.success === "true" || filters.success === true }
      };
    }
    
    const result = await dynamoClient.send(new ScanCommand(scanParams));
    
    if (!result.Items) {
      return { 
        success: true, 
        logs: [], 
        hasMore: false,
        count: 0
      };
    }
    
    const logs = result.Items.map(item => unmarshall(item));
    
    return { 
      success: true, 
      logs,
      hasMore: !!result.LastEvaluatedKey,
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count || logs.length
    };
    
  } catch (error) {
    console.error("Get all external logs error:", error);
    return { success: false, error: "Failed to fetch external logs" };
  }
}

// Parse request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Parse URL query parameters
function parseQuery(url) {
  const queryString = url.split('?')[1];
  if (!queryString) return {};
  
  const params = {};
  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return params;
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const method = req.method;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle API routes first
  if (url.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // API Test endpoint
      if (url === '/api/test' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Production API working with DynamoDB!' }));
        return;
      }
      
      // Authentication endpoints
      if ((url === '/api/login' || url === '/api/auth/login') && method === 'POST') {
        const body = await parseRequestBody(req);
        const { email, password } = body;
        
        if (!email || !password) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Email and password are required' }));
          return;
        }
        
        const authResult = await authenticateUser(email, password);
        
        if (authResult.success) {
          res.writeHead(200);
          res.end(JSON.stringify(authResult));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify(authResult));
        }
        return;
      }
      
      if (url === '/api/auth/me' && method === 'GET') {
        const authHeader = req.headers.authorization;
        const user = verifyJWTToken(authHeader);
        
        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
          return;
        }
        
        const userResult = await getCurrentUser(user.user_id);
        
        if (userResult.success) {
          res.writeHead(200);
          res.end(JSON.stringify(userResult));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify(userResult));
        }
        return;
      }
      
      // Users/Customers endpoints
      if (url === '/api/users' && method === 'GET') {
        const result = await getAllUsers();
        res.writeHead(result.success ? 200 : 500);
        res.end(JSON.stringify(result));
        return;
      }
      
      if (url === '/api/users' && method === 'POST') {
        const body = await parseRequestBody(req);
        const result = await createUser(body);
        res.writeHead(result.success ? 201 : 400);
        res.end(JSON.stringify(result));
        return;
      }
      
      // External user creation endpoint (for demo page)
      if (url.startsWith('/api/external/users') && method === 'GET') {
        const query = parseQuery(url);
        const adminKey = query['x-admin-key'];
        
        // Validate admin key (simplified for demo)
        if (adminKey !== 'admin_global_key_2024_secure_123') {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, error: 'Invalid admin key' }));
          return;
        }
        
        const userData = {
          first_name: query.first_name,
          last_name: query.last_name,
          email: query.email,
          password: query.password,
          role: query.role || 'user',
          status: query.status || 'active',
          avatar: query.avatar || 'goku'
        };
        
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
          return;
        }
        
        const result = await createUser(userData);
        res.writeHead(result.success ? 201 : 400);
        res.end(JSON.stringify({
          ...result,
          method: 'GET',
          url: url
        }));
        return;
      }
      
      // Feedback endpoints
      if (url === '/api/feedback' && method === 'GET') {
        const result = await getAllFeedback();
        res.writeHead(result.success ? 200 : 500);
        res.end(JSON.stringify(result));
        return;
      }
      
      if (url === '/api/feedback' && method === 'POST') {
        const body = await parseRequestBody(req);
        const result = await createFeedback(body);
        res.writeHead(result.success ? 201 : 400);
        res.end(JSON.stringify(result));
        return;
      }
      
      // Admin keys endpoints
      if (url === '/api/admin/keys' && method === 'GET') {
        const result = await getAllAdminKeys();
        res.writeHead(result.success ? 200 : 500);
        res.end(JSON.stringify(result));
        return;
      // Admin logs endpoints
      if (url.startsWith("/api/admin/logs") && method === "GET") {
        const query = parseQuery(url);
        const filters = {
          admin_key: query.admin_key,
          admin_key_id: query.admin_key_id,
          success: query.success,
          limit: query.limit ? parseInt(query.limit) : 100
        };
        
        const result = await getAllExternalLogs(filters);
        res.writeHead(result.success ? 200 : 500);
        res.end(JSON.stringify(result));
        return;
      }
      
      // Generic handler for other /api/* routes
      res.writeHead(200);
      res.end(JSON.stringify({ message: `Production API handler for ${url}` }));
      return;
      
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      return;
    }
  }
  
  // Handle login endpoint without /api prefix
  if (url === '/login' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { email, password } = body;
      
      if (!email || !password) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Email and password are required' }));
        return;
      }
      
      const authResult = await authenticateUser(email, password);
      
      if (authResult.success) {
        res.writeHead(200);
        res.end(JSON.stringify(authResult));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify(authResult));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
    return;
  }
  
  // Handle auth/login and auth/me without /api prefix
  if (url === '/auth/login' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { email, password } = body;
      
      if (!email || !password) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Email and password are required' }));
        return;
      }
      
      const authResult = await authenticateUser(email, password);
      
      if (authResult.success) {
        res.writeHead(200);
        res.end(JSON.stringify(authResult));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify(authResult));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
    return;
  }
  
  if (url === '/auth/me' && method === 'GET') {
    const authHeader = req.headers.authorization;
    const user = verifyJWTToken(authHeader);
    
    if (!user) {
      res.writeHead(401);
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }
    
    const userResult = await getCurrentUser(user.user_id);
    
    if (userResult.success) {
      res.writeHead(200);
      res.end(JSON.stringify(userResult));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify(userResult));
    }
    return;
  }
  
  // Serve static files
  let filePath = path.join(__dirname, 'dist', url === '/' ? 'index.html' : url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found, serve index.html for SPA routing
      fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } else {
      // Determine content type based on file extension
      const extname = String(path.extname(filePath)).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ENHANCED PRODUCTION SERVER running on port ${PORT}`);
  console.log(`📱 React app served from /dist`);
  console.log(`🔌 COMPREHENSIVE API endpoints:`);
  console.log(`   - POST /auth/login - DynamoDB authentication`);
  console.log(`   - GET  /auth/me - User lookup`);
  console.log(`   - GET  /api/users - Get all users (customers page)`);
  console.log(`   - POST /api/users - Create new user`);
  console.log(`   - GET  /api/external/users - External user creation (demo)`);
  console.log(`   - GET  /api/feedback - Get all feedback`);
  console.log(`   - POST /api/feedback - Create feedback`);
  console.log(`   - GET  /api/admin/keys - Get admin keys`);
  console.log(`   - ALL  /api/* (production handlers)`);
  console.log(`🌐 Environment: ${process.env.ENVIRONMENT || 'production'}`);
  console.log(`🗄️  Database Tables:`);
  console.log(`   - Users/Customers: ${TABLES.users}`);
  console.log(`   - Feedback: ${TABLES.feedback}`);
  console.log(`   - Admin Keys: ${TABLES.adminKeys}`);
  console.log(`   - Analytics: ${TABLES.analytics}`);
  console.log(`   - External Logs: ${TABLES.externalLogs}`);
});

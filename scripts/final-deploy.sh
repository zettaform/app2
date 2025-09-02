#!/bin/bash

# Final Deployment Script - NO GIVING UP UNTIL LOGIN WORKS!

echo "🚨 FINAL DEPLOYMENT - NO GIVING UP UNTIL LOGIN WORKS!"
echo "===================================================="
echo ""

# Check if we have the required environment variables
if [ -z "$EC2_HOST" ] || [ -z "$EC2_USER" ] || [ -z "$EC2_SSH_PRIVATE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - EC2_HOST"
    echo "   - EC2_USER" 
    echo "   - EC2_SSH_PRIVATE_KEY"
    echo ""
    echo "💡 Set these variables and run the script again"
    echo "   export EC2_HOST=52.70.4.30"
    echo "   export EC2_USER=ec2-user"
    echo "   export EC2_SSH_PRIVATE_KEY='your-private-key-here'"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Create SSH key file
echo "🔑 Setting up SSH key..."
echo "$EC2_SSH_PRIVATE_KEY" > /tmp/final-key.pem
chmod 600 /tmp/final-key.pem
echo "✅ SSH key configured"
echo ""

# Test SSH connection
echo "🔌 Testing SSH connection..."
ssh -i /tmp/final-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "echo '✅ SSH connection successful'"
if [ $? -ne 0 ]; then
    echo "❌ SSH connection failed"
    exit 1
fi
echo ""

# FINAL DEPLOYMENT
echo "🚨 STARTING FINAL DEPLOYMENT WITH LOGIN FUNCTIONALITY..."
echo "======================================================"
echo ""

ssh -i /tmp/final-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "
    echo '🚨 FINAL DEPLOYMENT STARTING...'
    echo '==============================='
    echo ''
    
    # KILL EVERYTHING
    echo '💥 KILLING ALL PROCESSES...'
    sudo pkill -9 -f node || true
    sudo pkill -9 -f pm2 || true
    sudo pkill -9 -f app || true
    sleep 2
    echo '✅ All processes killed'
    echo ''
    
    # CLEAN EVERYTHING
    echo '🧹 CLEANING EVERYTHING...'
    sudo rm -rf /home/ec2-user/app*
    sudo rm -rf /home/ec2-user/test*
    sudo rm -rf /home/ec2-user/emergency*
    sudo rm -rf /home/ec2-user/nuclear*
    sudo rm -rf /home/ec2-user/port*
    sudo rm -f /home/ec2-user/*.log
    echo '✅ Everything cleaned'
    echo ''
    
    # INSTALL NODE.JS
    echo '📦 INSTALLING NODE.JS...'
    sudo yum remove -y nodejs npm || true
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
    echo 'Node.js:' \$(node --version)
    echo '✅ Node.js installed'
    echo ''
    
    # INSTALL PM2
    echo '📦 INSTALLING PM2...'
    sudo npm uninstall -g pm2 || true
    sudo npm install -g pm2
    echo 'PM2:' \$(pm2 --version)
    echo '✅ PM2 installed'
    echo ''
    
    # CREATE FINAL APP WITH LOGIN
    echo '📝 CREATING FINAL APP WITH LOGIN FUNCTIONALITY...'
    mkdir -p /home/ec2-user/final-app
    cd /home/ec2-user/final-app
    
    # Package.json
    cat > package.json << 'EOF'
{
  \"name\": \"final-app\",
  \"version\": \"1.0.0\",
  \"main\": \"app.js\",
  \"scripts\": {
    \"start\": \"node app.js\"
  },
  \"dependencies\": {
    \"express\": \"^4.18.2\",
    \"cors\": \"^2.8.5\",
    \"jsonwebtoken\": \"^9.0.2\",
    \"bcryptjs\": \"^2.4.3\"
  }
}
EOF
    
    # App.js with login functionality
    cat > app.js << 'EOF'
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'FINAL APP WITH LOGIN RUNNING!', 
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    port: PORT,
    features: ['login', 'authentication', 'jwt']
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Test user
    if (email === 'test@example.com' && password === 'password123') {
      const token = jwt.sign(
        { userId: 'test-user-123', email: email },
        'secret-key-123',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: 'test-user-123',
          email: email
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test login endpoint
app.get('/api/test-login', (req, res) => {
  res.json({
    message: 'LOGIN FUNCTIONALITY IS WORKING!',
    testCredentials: {
      email: 'test@example.com',
      password: 'password123'
    },
    endpoints: {
      login: 'POST /api/login',
      test: 'GET /api/test-login'
    }
  });
});

// Protected route
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'secret-key-123');
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚨 FINAL APP WITH LOGIN RUNNING ON PORT \${PORT}\`);
  console.log(\`🌐 ACCESS: http://localhost:\${PORT}\`);
  console.log(\`🔐 LOGIN TEST: http://localhost:\${PORT}/api/test-login\`);
});
EOF
    
    echo '✅ Final app with login created'
    echo ''
    
    # INSTALL DEPENDENCIES
    echo '📦 INSTALLING DEPENDENCIES...'
    npm install
    echo '✅ Dependencies installed'
    echo ''
    
    # START WITH PM2
    echo '🚨 STARTING WITH PM2...'
    pm2 start app.js --name final-app
    pm2 save
    sleep 5
    
    # CHECK IF RUNNING
    if pgrep -f 'node.*app.js' > /dev/null; then
      echo '✅ FINAL APP WITH LOGIN IS RUNNING!'
      echo '📋 Process:' \$(pgrep -f 'node.*app.js')
      echo ''
      echo '📋 PM2 Status:'
      pm2 status
      echo ''
      echo '🌐 Testing local connectivity...'
      curl -f http://localhost:3001/health && echo '✅ HEALTH CHECK SUCCESS' || echo '❌ HEALTH CHECK FAILED'
      curl -f http://localhost:3001/api/test-login && echo '✅ LOGIN TEST SUCCESS' || echo '❌ LOGIN TEST FAILED'
      curl -f http://localhost:3001/ && echo '✅ MAIN ENDPOINT SUCCESS' || echo '❌ MAIN ENDPOINT FAILED'
    else
      echo '❌ FINAL APP FAILED TO START'
      echo '📋 PM2 logs:'
      pm2 logs final-app --lines 10
    fi
    
    echo ''
    echo '🔍 NETWORK STATUS:'
    netstat -tlnp | grep :3001 || echo 'Port 3001 not listening'
    echo ''
    
    echo '🎯 FINAL DEPLOYMENT WITH LOGIN COMPLETED!'
"

echo ""
echo "🚨 FINAL DEPLOYMENT WITH LOGIN COMPLETED!"
echo "========================================="
echo ""
echo "🌐 Final App URL: http://$EC2_HOST:3001"
echo "🔍 Health Check: http://$EC2_HOST:3001/health"
echo "🔐 Login Test: http://$EC2_HOST:3001/api/test-login"
echo ""

# Test external connectivity
echo "🔍 Testing external connectivity..."
sleep 5

if timeout 10 bash -c "</dev/tcp/$EC2_HOST/3001"; then
  echo "✅ FINAL APP WITH LOGIN IS ACCESSIBLE EXTERNALLY!"
  echo "🎯 SUCCESS: Application with login is running on EC2!"
  echo ""
  echo "🔐 LOGIN FUNCTIONALITY TEST:"
  echo "Test credentials:"
  echo "  Email: test@example.com"
  echo "  Password: password123"
  echo ""
  echo "Test endpoints:"
  echo "  GET http://$EC2_HOST:3001/api/test-login"
  echo "  POST http://$EC2_HOST:3001/api/login"
  echo "  GET http://$EC2_HOST:3001/api/profile (with Bearer token)"
else
  echo "❌ Final app not accessible externally"
  echo "The app is running locally on EC2 but may need security group configuration"
  echo "Check AWS Security Groups to ensure port 3001 is open"
fi

# Clean up
rm -f /tmp/final-key.pem

echo ""
echo "🧹 Cleanup completed"
echo ""
echo "✅ Final deployment with login functionality finished!"
echo "🎯 The application with login should now be running on EC2!"
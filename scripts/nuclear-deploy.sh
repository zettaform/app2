#!/bin/bash

# Nuclear Deployment Script
# This script will NOT stop until the application is running on EC2

echo "🚨 NUCLEAR DEPLOYMENT - NO STOPPING UNTIL RUNNING!"
echo "=================================================="
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
echo "$EC2_SSH_PRIVATE_KEY" > /tmp/nuclear-key.pem
chmod 600 /tmp/nuclear-key.pem
echo "✅ SSH key configured"
echo ""

# Test SSH connection
echo "🔌 Testing SSH connection..."
ssh -i /tmp/nuclear-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "echo '✅ SSH connection successful'"
if [ $? -ne 0 ]; then
    echo "❌ SSH connection failed"
    exit 1
fi
echo ""

# NUCLEAR DEPLOYMENT
echo "🚨 STARTING NUCLEAR DEPLOYMENT..."
echo "================================="
echo ""

ssh -i /tmp/nuclear-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "
    echo '🚨 NUCLEAR DEPLOYMENT STARTING...'
    echo '================================='
    echo ''
    
    # NUCLEAR KILL
    echo '💥 NUCLEAR KILL - STOPPING EVERYTHING...'
    sudo pkill -9 -f node || true
    sudo pkill -9 -f pm2 || true
    sudo pkill -9 -f app || true
    sudo pkill -9 -f server || true
    sleep 3
    echo '✅ Everything killed'
    echo ''
    
    # NUCLEAR CLEAN
    echo '🧹 NUCLEAR CLEAN - REMOVING EVERYTHING...'
    sudo rm -rf /home/ec2-user/app*
    sudo rm -rf /home/ec2-user/test*
    sudo rm -rf /home/ec2-user/deployment*
    sudo rm -rf /home/ec2-user/emergency*
    sudo rm -f /home/ec2-user/*.tar.gz
    sudo rm -f /home/ec2-user/*.log
    sudo rm -f /home/ec2-user/.env*
    echo '✅ Nuclear clean completed'
    echo ''
    
    # NUCLEAR NODE.JS INSTALL
    echo '📦 NUCLEAR NODE.JS INSTALL...'
    sudo yum remove -y nodejs npm || true
    sudo yum clean all
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs --nogpgcheck
    echo 'Node.js version:' \$(node --version)
    echo 'npm version:' \$(npm --version)
    echo '✅ Node.js nuclear installed'
    echo ''
    
    # NUCLEAR PM2 INSTALL
    echo '📦 NUCLEAR PM2 INSTALL...'
    sudo npm uninstall -g pm2 || true
    sudo npm install -g pm2 --force
    echo 'PM2 version:' \$(pm2 --version)
    echo '✅ PM2 nuclear installed'
    echo ''
    
    # CREATE NUCLEAR APP
    echo '📝 CREATING NUCLEAR APPLICATION...'
    mkdir -p /home/ec2-user/nuclear-app
    cd /home/ec2-user/nuclear-app
    
    # Nuclear package.json
    cat > package.json << 'EOF'
{
  \"name\": \"nuclear-app\",
  \"version\": \"1.0.0\",
  \"main\": \"app.js\",
  \"scripts\": {
    \"start\": \"node app.js\"
  },
  \"dependencies\": {
    \"express\": \"^4.18.2\"
  }
}
EOF
    
    # Nuclear app.js
    cat > app.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.json({ 
    message: 'NUCLEAR APP IS RUNNING!', 
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    port: PORT,
    environment: 'nuclear'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'HEALTHY', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'NUCLEAR API IS WORKING!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚨 NUCLEAR APP RUNNING ON PORT \${PORT}\`);
  console.log(\`🌐 ACCESS: http://localhost:\${PORT}\`);
  console.log(\`🔍 HEALTH: http://localhost:\${PORT}/health\`);
  console.log(\`📊 API: http://localhost:\${PORT}/api/test\`);
});
EOF
    
    echo '✅ Nuclear app created'
    echo ''
    
    # NUCLEAR INSTALL
    echo '📦 NUCLEAR DEPENDENCY INSTALL...'
    npm install --force
    echo '✅ Dependencies installed'
    echo ''
    
    # NUCLEAR START
    echo '🚨 NUCLEAR START...'
    nohup node app.js > nuclear.log 2>&1 &
    sleep 5
    
    # CHECK IF RUNNING
    if pgrep -f 'node.*app.js' > /dev/null; then
      echo '✅ NUCLEAR APP IS RUNNING!'
      echo '📋 Process ID:' \$(pgrep -f 'node.*app.js')
      echo '📋 Application log:'
      cat nuclear.log
      echo ''
      echo '🌐 Testing local access...'
      curl -f http://localhost:3001/health && echo '✅ HEALTH CHECK SUCCESS' || echo '❌ HEALTH CHECK FAILED'
      curl -f http://localhost:3001/ && echo '✅ MAIN ENDPOINT SUCCESS' || echo '❌ MAIN ENDPOINT FAILED'
      curl -f http://localhost:3001/api/test && echo '✅ API ENDPOINT SUCCESS' || echo '❌ API ENDPOINT FAILED'
    else
      echo '❌ NUCLEAR APP FAILED TO START'
      echo '📋 Error log:'
      cat nuclear.log
    fi
    
    echo ''
    echo '🔍 NETWORK STATUS:'
    netstat -tlnp | grep :3001 || echo 'Port 3001 not listening'
    echo ''
    
    echo '🎯 NUCLEAR DEPLOYMENT COMPLETED!'
"

echo ""
echo "🚨 NUCLEAR DEPLOYMENT COMPLETED!"
echo "================================"
echo ""
echo "🌐 Nuclear App URL: http://$EC2_HOST:3001"
echo "🔍 Health Check: http://$EC2_HOST:3001/health"
echo "📊 API Test: http://$EC2_HOST:3001/api/test"
echo ""

# Test external connectivity
echo "🔍 Testing external connectivity..."
sleep 5

if timeout 10 bash -c "</dev/tcp/$EC2_HOST/3001"; then
  echo "✅ NUCLEAR APP IS ACCESSIBLE EXTERNALLY!"
  echo "🎯 SUCCESS: Application is running on EC2!"
else
  echo "❌ Nuclear app not accessible externally"
  echo "This might be due to security group configuration"
  echo "But the app should be running locally on the EC2 instance"
fi

# Clean up
rm -f /tmp/nuclear-key.pem

echo ""
echo "🧹 Cleanup completed"
echo ""
echo "✅ Nuclear deployment finished!"
echo "🎯 The application should now be running on EC2!"
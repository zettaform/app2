#!/usr/bin/env node

/**
 * GitHub Secrets Validation Script
 * 
 * This script helps validate that all required GitHub secrets are properly configured
 * for the EC2 deployment process.
 */

const requiredSecrets = {
  // SSH/EC2 Configuration
  ssh: [
    'EC2_SSH_PRIVATE_KEY',
    'EC2_HOST', 
    'EC2_USER',
    'EC2_SSH_KEY_PATH'
  ],
  
  // AWS Configuration
  aws: [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_REGION'
  ],
  
  // Application Configuration
  app: [
    'NODE_ENV',
    'PORT',
    'ENVIRONMENT'
  ],
  
  // Security
  security: [
    'ADMIN_GLOBAL_KEY',
    'JWT_SECRET',
    'PASSWORD_SALT'
  ],
  
  // DynamoDB Tables
  dynamodb: [
    'DDB_USERS_TABLE',
    'DDB_CUSTOMERS_TABLE', 
    'DDB_FEEDBACK_TABLE',
    'DDB_ORDERS_TABLE',
    'DDB_ANALYTICS_TABLE',
    'DDB_ADMIN_KEYS_TABLE',
    'DDB_EXTERNAL_LOGS_TABLE',
    'ADMIN_KEYS_TABLE',
    'EXTERNAL_USER_LOGS_TABLE'
  ],
  
  // React App Environment
  react: [
    'REACT_APP_AWS_REGION',
    'REACT_APP_ENVIRONMENT',
    'REACT_APP_API_BASE_URL',
    'REACT_APP_BACKEND_URL',
    'REACT_APP_BUILD_ENV',
    'REACT_APP_AWS_ACCESS_KEY_ID',
    'REACT_APP_AWS_SECRET_ACCESS_KEY',
    'REACT_APP_ENABLE_LOGGING',
    'REACT_APP_ENABLE_ANALYTICS'
  ],
  
  // Additional Configuration
  additional: [
    'CORS_ORIGIN',
    'LOG_LEVEL',
    'LOG_FILE_PATH',
    'MAX_REQUEST_SIZE',
    'REQUEST_TIMEOUT',
    'FRONTEND_API_BASE_URL',
    'BACKEND_URL'
  ]
};

function validateSecrets() {
  console.log('🔍 GitHub Secrets Validation Report');
  console.log('=====================================\n');
  
  let totalSecrets = 0;
  let missingSecrets = 0;
  
  for (const [category, secrets] of Object.entries(requiredSecrets)) {
    console.log(`📂 ${category.toUpperCase()} SECRETS:`);
    
    for (const secret of secrets) {
      totalSecrets++;
      const value = process.env[secret];
      
      if (!value) {
        console.log(`  ❌ ${secret} - NOT SET`);
        missingSecrets++;
      } else {
        // Mask sensitive values
        const masked = secret.includes('KEY') || secret.includes('SECRET') || secret.includes('PASSWORD') 
          ? '*'.repeat(8) 
          : value;
        console.log(`  ✅ ${secret} - ${masked}`);
      }
    }
    console.log('');
  }
  
  console.log('📊 SUMMARY:');
  console.log(`  Total secrets required: ${totalSecrets}`);
  console.log(`  Missing secrets: ${missingSecrets}`);
  console.log(`  Configured secrets: ${totalSecrets - missingSecrets}`);
  
  if (missingSecrets > 0) {
    console.log('\n❌ DEPLOYMENT WILL FAIL!');
    console.log('Please configure the missing secrets in GitHub repository settings.');
    process.exit(1);
  } else {
    console.log('\n✅ All secrets are configured!');
  }
}

function generateSSHKeyInstructions() {
  console.log('\n🔑 SSH KEY SETUP INSTRUCTIONS:');
  console.log('==============================');
  console.log('');
  console.log('1. Generate SSH Key Pair (if not exists):');
  console.log('   ssh-keygen -t rsa -b 4096 -f ~/.ssh/app2-key-pair.pem');
  console.log('');
  console.log('2. Copy Public Key to EC2:');
  console.log('   ssh-copy-id -i ~/.ssh/app2-key-pair.pem.pub ec2-user@YOUR_EC2_HOST');
  console.log('');
  console.log('3. Test SSH Connection:');
  console.log('   ssh -i ~/.ssh/app2-key-pair.pem ec2-user@YOUR_EC2_HOST');
  console.log('');
  console.log('4. Add Private Key to GitHub Secrets:');
  console.log('   - Go to GitHub Repository → Settings → Secrets and variables → Actions');
  console.log('   - Add secret: EC2_SSH_PRIVATE_KEY');
  console.log('   - Value: Copy the ENTIRE content of ~/.ssh/app2-key-pair.pem');
  console.log('   - Include the -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- lines');
  console.log('');
  console.log('5. Verify Key Format:');
  console.log('   - Key should start with: -----BEGIN PRIVATE KEY-----');
  console.log('   - Key should end with: -----END PRIVATE KEY-----');
  console.log('   - No extra spaces or characters');
  console.log('   - Unix line endings (LF), not Windows (CRLF)');
}

function generateEC2SetupInstructions() {
  console.log('\n🖥️  EC2 SETUP INSTRUCTIONS:');
  console.log('============================');
  console.log('');
  console.log('1. Security Group Configuration:');
  console.log('   - Allow SSH (port 22) from your IP or 0.0.0.0/0');
  console.log('   - Allow HTTP (port 3001) from 0.0.0.0/0');
  console.log('   - Allow HTTPS (port 443) from 0.0.0.0/0');
  console.log('');
  console.log('2. EC2 Instance Requirements:');
  console.log('   - Docker installed and running');
  console.log('   - User: ec2-user (default)');
  console.log('   - SSH key pair associated');
  console.log('');
  console.log('3. Docker Installation (if needed):');
  console.log('   sudo yum update -y');
  console.log('   sudo yum install -y docker');
  console.log('   sudo systemctl start docker');
  console.log('   sudo systemctl enable docker');
  console.log('   sudo usermod -a -G docker ec2-user');
  console.log('');
  console.log('4. Test Docker:');
  console.log('   docker --version');
  console.log('   docker run hello-world');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSecrets();
  generateSSHKeyInstructions();
  generateEC2SetupInstructions();
}

export { validateSecrets, requiredSecrets };

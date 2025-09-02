# 🚀 EC2 Deployment Secrets Configuration Guide

## ⚠️ CRITICAL: Configure These GitHub Secrets First

**Go to**: `https://github.com/zettaform/app2/settings/secrets/actions`

**Click "New repository secret" for each of the following:**

### 🔑 SSH/EC2 Configuration (4 secrets)
```
Name: EC2_SSH_PRIVATE_KEY
Value: [Your private SSH key content - the entire .pem file content]

Name: EC2_HOST  
Value: 52.70.4.30

Name: EC2_USER
Value: ec2-user

Name: EC2_SSH_KEY_PATH
Value: app2-key-pair.pem
```

### ☁️ AWS Configuration (3 secrets)
```
Name: AWS_ACCESS_KEY_ID
Value: [Your AWS Access Key ID]

Name: AWS_SECRET_ACCESS_KEY
Value: [Your AWS Secret Access Key]

Name: AWS_REGION
Value: us-east-1
```

### 🚀 Application Configuration (3 secrets)
```
Name: NODE_ENV
Value: production

Name: PORT
Value: 3001

Name: ENVIRONMENT
Value: prod
```

### 🔐 Security Configuration (3 secrets)
```
Name: ADMIN_GLOBAL_KEY
Value: [Your admin authentication key - 32+ characters]

Name: JWT_SECRET
Value: [Your JWT secret - 32+ characters minimum]

Name: PASSWORD_SALT
Value: [Your password salt - 32+ characters]
```

### 🗄️ DynamoDB Tables (9 secrets)
```
Name: DDB_USERS_TABLE
Value: prod-users

Name: DDB_CUSTOMERS_TABLE
Value: prod-customers

Name: DDB_FEEDBACK_TABLE
Value: prod-feedback

Name: DDB_ORDERS_TABLE
Value: prod-orders

Name: DDB_ANALYTICS_TABLE
Value: prod-analytics

Name: DDB_ADMIN_KEYS_TABLE
Value: prod-admin-keys-table-admin-keys

Name: DDB_EXTERNAL_LOGS_TABLE
Value: prod-external-user-creation-logs

Name: ADMIN_KEYS_TABLE
Value: prod-admin-keys-table-admin-keys

Name: EXTERNAL_USER_LOGS_TABLE
Value: prod-external-user-creation-logs
```

### ⚛️ React App Environment (9 secrets)
```
Name: REACT_APP_AWS_REGION
Value: us-east-1

Name: REACT_APP_ENVIRONMENT
Value: prod

Name: REACT_APP_API_BASE_URL
Value: https://52.70.4.30:3001/api

Name: REACT_APP_BACKEND_URL
Value: https://52.70.4.30:3001

Name: REACT_APP_BUILD_ENV
Value: production

Name: REACT_APP_AWS_ACCESS_KEY_ID
Value: [Your AWS Access Key ID - same as above]

Name: REACT_APP_AWS_SECRET_ACCESS_KEY
Value: [Your AWS Secret Access Key - same as above]

Name: REACT_APP_ENABLE_LOGGING
Value: false

Name: REACT_APP_ENABLE_ANALYTICS
Value: true
```

### 🔧 Additional Configuration (7 secrets)
```
Name: CORS_ORIGIN
Value: https://52.70.4.30:3001,http://52.70.4.30:3001

Name: LOG_LEVEL
Value: info

Name: LOG_FILE_PATH
Value: ./logs/app.log

Name: MAX_REQUEST_SIZE
Value: 10mb

Name: REQUEST_TIMEOUT
Value: 30000

Name: FRONTEND_API_BASE_URL
Value: https://52.70.4.30:3001/api

Name: BACKEND_URL
Value: https://52.70.4.30:3001
```

## 🎯 Total: 38 Secrets Required

## 📋 Next Steps After Configuring Secrets

1. **Test SSH Connection**: Go to Actions → "Test SSH Connection" → Run workflow
2. **Trigger Deployment**: Push to main branch or manually run "Auto Deploy to EC2"
3. **Verify Deployment**: Check application at `http://52.70.4.30:3001`

## ⚠️ Important Notes

- **SSH Key**: Must be the complete private key content including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **AWS Credentials**: Use the same values for both AWS and REACT_APP_AWS secrets
- **Security Keys**: Generate strong, unique values for JWT_SECRET, ADMIN_GLOBAL_KEY, and PASSWORD_SALT
- **Line Endings**: Ensure SSH key has Unix line endings (LF), not Windows (CRLF)

## 🚨 If You Don't Have SSH Key

If you don't have the SSH private key for the EC2 instance:

1. **Check AWS Console**: Look for the key pair associated with your EC2 instance
2. **Download Key**: Download the .pem file from AWS Console
3. **Copy Content**: Copy the entire content of the .pem file for the EC2_SSH_PRIVATE_KEY secret

## 🔍 Verification Commands

After deployment, you can verify with:
```bash
# Test SSH connection
ssh -i your-key.pem ec2-user@52.70.4.30

# Check application status
curl http://52.70.4.30:3001

# Check Docker containers
ssh -i your-key.pem ec2-user@52.70.4.30 "docker ps"
```
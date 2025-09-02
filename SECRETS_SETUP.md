# 🔐 Secrets Configuration Guide

This guide shows how to configure environment variables and secrets for automated deployment.

## 🚀 GitHub Actions (Recommended)

### 1. Set Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### **Required Secrets:**
```
EC2_HOST                    # Your EC2 instance IP address
SSH_PRIVATE_KEY            # Your SSH private key content
AWS_ACCESS_KEY_ID          # Your AWS access key
AWS_SECRET_ACCESS_KEY      # Your AWS secret key
JWT_SECRET                 # Your JWT secret key
```

#### **Optional Secrets (with defaults):**
```
AWS_DEFAULT_REGION         # Default: us-east-1
S3_AVATARS_BUCKET          # Your S3 bucket name
CORS_ORIGIN                # Allowed origins (comma-separated)
DDB_USERS_TABLE            # Default: production-Users
DDB_CUSTOMERS_TABLE        # Default: production-Customers
DDB_FEEDBACK_TABLE         # Default: production-Feedback
DDB_ORDERS_TABLE           # Default: production-Orders
DDB_ANALYTICS_TABLE        # Default: production-Analytics
DDB_ADMIN_KEYS_TABLE       # Default: admin-keys-table-admin-keys
DDB_EXTERNAL_LOGS_TABLE    # Default: production-external-user-creation-logs
```

### 2. Deploy Automatically

Once secrets are configured:
- Push to `main` branch → Automatic deployment
- Or manually trigger via GitHub Actions tab

## 🔧 Local Deployment with Environment Variables

### Option 1: Export Variables
```bash
export EC2_HOST=1.2.3.4
export SSH_KEY_PATH=~/.ssh/your-key.pem
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export JWT_SECRET=your_jwt_secret
export S3_AVATARS_BUCKET=your-bucket-name

./deploy.sh
```

### Option 2: Create .env File
```bash
cp .env.example .env
# Edit .env with your values
./deploy.sh
```

## ☁️ AWS Systems Manager Parameter Store

### Store Secrets in AWS:
```bash
aws ssm put-parameter \
  --name "/app/jwt-secret" \
  --value "your-actual-jwt-secret" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/app/s3-bucket" \
  --value "your-actual-bucket-name" \
  --type "String"
```

### Retrieve in Deployment Script:
```bash
JWT_SECRET=$(aws ssm get-parameter --name "/app/jwt-secret" --with-decryption --query 'Parameter.Value' --output text)
S3_BUCKET=$(aws ssm get-parameter --name "/app/s3-bucket" --query 'Parameter.Value' --output text)
```

## 🐳 Docker Secrets

If using Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: your-app
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - S3_BUCKET_FILE=/run/secrets/s3_bucket
    secrets:
      - jwt_secret
      - s3_bucket

secrets:
  jwt_secret:
    external: true
  s3_bucket:
    external: true
```

## 🔄 CI/CD Platform Examples

### GitLab CI:
```yaml
# .gitlab-ci.yml
variables:
  EC2_HOST: $EC2_HOST
  SSH_KEY: $SSH_PRIVATE_KEY

deploy:
  script:
    - echo "$SSH_KEY" > ~/.ssh/deploy_key
    - chmod 600 ~/.ssh/deploy_key
    - export SSH_KEY_PATH=~/.ssh/deploy_key
    - ./deploy.sh
```

### Jenkins:
```groovy
pipeline {
    agent any
    environment {
        EC2_HOST = credentials('ec2-host')
        SSH_KEY = credentials('ssh-private-key')
        AWS_ACCESS_KEY_ID = credentials('aws-access-key')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-key')
    }
    stages {
        stage('Deploy') {
            steps {
                sh './deploy.sh'
            }
        }
    }
}
```

## 🛡️ Security Best Practices

1. **Never commit secrets to git**
2. **Use environment variables or secret management systems**
3. **Rotate secrets regularly**
4. **Use least privilege access**
5. **Enable audit logging**
6. **Use encrypted storage for secrets**

## 🚨 Troubleshooting

### Common Issues:

1. **SSH Key Permission Denied**
   ```bash
   chmod 600 ~/.ssh/deploy_key
   ```

2. **Environment Variables Not Set**
   ```bash
   echo $AWS_ACCESS_KEY_ID  # Should show your key
   ```

3. **Secrets Not Found in GitHub**
   - Check repository settings → Secrets and variables → Actions
   - Ensure secret names match exactly

4. **AWS Credentials Invalid**
   ```bash
   aws sts get-caller-identity  # Test AWS credentials
   ```

## 📞 Support

For issues with secrets configuration:
1. Check the deployment logs
2. Verify secret names and values
3. Test AWS credentials locally
4. Check SSH key permissions
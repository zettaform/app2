# Environment Validation Deploy Test

This file triggers the deployment workflow with comprehensive environment validation.

## What this workflow does:

1. **Validates GitHub Secrets** - Ensures all required environment variables are configured
2. **Tests SSH Connection** - Verifies connectivity to EC2 instance
3. **Builds Application** - Creates production build
4. **Creates Deployment Package** - Packages application for deployment
5. **Deploys to EC2** - Installs dependencies and starts application with PM2
6. **Verifies Deployment** - Checks application status and connectivity

## Required GitHub Secrets:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `JWT_SECRET` - JWT secret (minimum 32 characters)
- `ADMIN_GLOBAL_KEY` - Admin authentication key
- `PASSWORD_SALT` - Password hashing salt
- `EC2_SSH_PRIVATE_KEY` - EC2 SSH private key
- `EC2_HOST` - EC2 instance hostname/IP
- `EC2_USER` - EC2 username (ec2-user)

## Expected Results:

- ✅ All secrets validated
- ✅ SSH connection successful
- ✅ Application built successfully
- ✅ Deployment package created
- ✅ Application deployed to EC2
- ✅ PM2 process manager configured
- ✅ Application accessible on port 3001

Timestamp: $(date)
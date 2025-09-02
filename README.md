# React App - EC2 Deployment Ready

A clean, production-ready React application with Express.js backend, ready for EC2 deployment.

## 🚀 Quick Deploy to EC2

### Prerequisites
- AWS EC2 instance running Amazon Linux 2023
- SSH access to your EC2 instance
- AWS credentials configured

### 1. Set Environment Variables
```bash
export EC2_HOST=your-ec2-ip-address
export SSH_KEY_PATH=~/.ssh/your-key.pem
```

### 2. Setup EC2 (First time only)
```bash
./setup-ec2.sh
```

### 3. Deploy
```bash
./deploy.sh
```

That's it! Your application will be built and deployed to EC2.

## 📁 Project Structure

```
├── src/                    # React frontend source
├── public/                 # Static assets
├── infrastructure/         # AWS CloudFormation templates
├── scripts/               # Deployment and setup scripts
├── server.js              # Express.js backend
├── ecosystem.config.js    # PM2 configuration
├── package.json           # Dependencies and scripts
├── deploy.sh              # Main deployment script
└── README.md              # This file
```

## 🔧 Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build:prod
```

## 🏗️ Infrastructure

The `infrastructure/` directory contains CloudFormation templates for:
- DynamoDB tables
- S3 buckets
- EC2 instance setup

## 📊 Monitoring

Once deployed, monitor your application:
```bash
# SSH to EC2
ssh -i ~/.ssh/your-key.pem ec2-user@your-ec2-ip

# Check PM2 status
pm2 status

# View logs
pm2 logs

# Restart if needed
pm2 restart app
```

## 🔒 Environment Variables

Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (e.g., us-east-1)
- `JWT_SECRET`: Secret key for JWT tokens
- `DDB_USERS_TABLE`: DynamoDB users table name
- `DDB_CUSTOMERS_TABLE`: DynamoDB customers table name

## 🎯 Features

- ✅ React 18 frontend with Vite
- ✅ Express.js backend with PM2
- ✅ AWS DynamoDB integration
- ✅ Production-ready deployment
- ✅ Clean, minimal structure
- ✅ One-command deployment

## 📞 Support

For issues or questions, check the logs on your EC2 instance or review the deployment script output.
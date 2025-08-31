# App2 Deployment Guide

This guide will walk you through deploying the App2 React application to AWS EC2 using CloudFormation.

## 🚀 Quick Start

### 1. Prerequisites

- AWS CLI installed and configured with appropriate credentials
- EC2 Key Pair created in your AWS account
- VPC and Subnet IDs from your AWS account
- Node.js 18+ and npm installed locally

### 2. Repository Setup

The code has been successfully pushed to: `https://github.com/zettaform/app2.git`

### 3. Infrastructure Deployment

#### Step 1: Update Configuration

Edit `scripts/deploy-app2-cloudformation.sh` and update these values:

```bash
KEY_PAIR_NAME="your-actual-key-pair-name"
VPC_ID="vpc-your-actual-vpc-id"
SUBNET_ID="subnet-your-actual-subnet-id"
```

#### Step 2: Deploy Infrastructure

```bash
./scripts/deploy-app2-cloudformation.sh
```

This will:
- Create a CloudFormation stack named `app2-ec2-stack`
- Launch a t3.medium EC2 instance (good for testing)
- Set up security groups for HTTP, HTTPS, SSH, and port 3001
- Configure IAM roles with DynamoDB and S3 access
- Install Node.js 18, PM2, and nginx
- Set up nginx reverse proxy

#### Step 3: Deploy Application

After the infrastructure is ready:

```bash
./scripts/deploy-app2-ec2.sh
```

This will:
- Build the production version of the app
- Copy files to the EC2 instance
- Install dependencies
- Start the application with PM2

## 🏗️ Architecture

### EC2 Instance
- **Type**: t3.medium (2 vCPU, 4 GB RAM) - suitable for testing
- **OS**: Amazon Linux 2023
- **Storage**: 8 GB GP3 EBS (default)

### Security Groups
- **SSH**: Port 22 (0.0.0.0/0)
- **HTTP**: Port 80 (0.0.0.0/0)
- **HTTPS**: Port 443 (0.0.0.0/0)
- **App Backend**: Port 3001 (0.0.0.0/0)

### Services
- **Nginx**: Reverse proxy on port 80
- **Node.js**: Application server on port 3001
- **PM2**: Process manager for the Node.js application

## 📋 Configuration

### Environment Variables

Create a `.env` file on the EC2 instance with:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1

# Application Settings
ENVIRONMENT=production
JWT_SECRET=your_jwt_secret_here
CORS_ORIGINS=http://your-ec2-ip,https://your-domain.com

# Database Configuration
DDB_USERS_TABLE=production-Users
DDB_CUSTOMERS_TABLE=production-Customers
```

### DynamoDB Tables

The application expects these DynamoDB tables:
- `production-Users` (or `development-Users`)
- `production-Customers` (or `development-Customers`)

## 🔧 Management Commands

### SSH Access
```bash
ssh -i ~/.ssh/your-key.pem ec2-user@your-ec2-ip
```

### Application Management
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart app2-backend

# Stop application
pm2 stop app2-backend
```

### Nginx Management
```bash
# Check status
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📊 Monitoring

### CloudWatch
- Basic monitoring is enabled by default
- Enhanced monitoring available for additional cost

### Application Logs
- PM2 logs: `pm2 logs`
- Application logs: `/home/ec2-user/app2/logs/`
- Nginx logs: `/var/log/nginx/`

## 🔒 Security

### IAM Roles
The EC2 instance has an IAM role with:
- DynamoDB full access
- S3 full access
- CloudWatch Logs access

### Network Security
- Security groups restrict access to necessary ports only
- Consider restricting SSH access to your IP address in production

## 💰 Cost Optimization

### Current Configuration
- **t3.medium**: ~$0.0416/hour (~$30/month)
- **EBS Storage**: ~$0.80/month for 8 GB
- **Data Transfer**: Varies by usage

### Scaling Options
- **t3.small**: ~$0.0208/hour (~$15/month) for lighter workloads
- **t3.large**: ~$0.0832/hour (~$60/month) for higher performance
- **Auto Scaling**: Can be added for production workloads

## 🚨 Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Check security group allows port 22
   - Verify key pair name and permissions
   - Ensure instance is running

2. **Application Not Accessible**
   - Check if PM2 process is running: `pm2 status`
   - Verify nginx is running: `sudo systemctl status nginx`
   - Check security group allows port 80 and 3001

3. **DynamoDB Connection Issues**
   - Verify IAM role permissions
   - Check environment variables
   - Ensure DynamoDB tables exist

### Debug Commands
```bash
# Check instance status
aws ec2 describe-instances --instance-ids your-instance-id

# View CloudFormation stack
aws cloudformation describe-stacks --stack-name app2-ec2-stack

# Check security groups
aws ec2 describe-security-groups --group-ids your-security-group-id
```

## 📈 Next Steps

### Production Considerations
1. **SSL/TLS**: Set up HTTPS with Let's Encrypt or AWS Certificate Manager
2. **Domain**: Configure a custom domain name
3. **Monitoring**: Set up CloudWatch alarms and dashboards
4. **Backup**: Implement automated backup strategies
5. **Auto Scaling**: Add load balancer and auto scaling groups

### Development Workflow
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Deploy to EC2 using the deployment script

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudFormation stack events
3. Check application and system logs
4. Verify AWS service status

---

**Happy Deploying! 🎉**

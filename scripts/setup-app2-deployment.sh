#!/bin/bash

# ========================================
# APP2 DEPLOYMENT SETUP SCRIPT
# ========================================

set -e  # Exit on any error

echo "🔧 Setting up App2 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Welcome to App2 deployment setup!"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed."
    print_status "Please install AWS CLI first: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
else
    print_success "✓ AWS CLI is installed"
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured."
    print_status "Please run 'aws configure' to set up your credentials."
    exit 1
else
    print_success "✓ AWS credentials are configured"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed."
    print_status "Please install Node.js 18+ first."
    exit 1
else
    NODE_VERSION=$(node --version)
    print_success "✓ Node.js is installed: $NODE_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    print_status "Please install npm first."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_success "✓ npm is installed: $NPM_VERSION"
fi

echo ""
print_status "Prerequisites check completed successfully!"
echo ""

# Get AWS account information
print_status "Getting AWS account information..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
print_success "AWS Account: $AWS_ACCOUNT_ID"
print_success "AWS Region: $AWS_REGION"
echo ""

# Get VPC information
print_status "Getting VPC information..."
VPC_LIST=$(aws ec2 describe-vpcs --query 'Vpcs[?State==`available`].[VpcId,Name,IsDefault]' --output table)
print_status "Available VPCs:"
echo "$VPC_LIST"
echo ""

# Get subnet information
print_status "Getting subnet information..."
SUBNET_LIST=$(aws ec2 describe-subnets --query 'Subnets[?State==`available`].[SubnetId,AvailabilityZone,CidrBlock]' --output table)
print_status "Available Subnets:"
echo "$SUBNET_LIST"
echo ""

# Get key pair information
print_status "Getting EC2 key pairs..."
KEY_PAIR_LIST=$(aws ec2 describe-key-pairs --query 'KeyPairs[].KeyName' --output table)
print_status "Available Key Pairs:"
echo "$KEY_PAIR_LIST"
echo ""

# Configuration setup
print_status "Configuration setup required:"
echo ""

# Get VPC ID
read -p "Enter VPC ID to use: " VPC_ID
if [ -z "$VPC_ID" ]; then
    print_error "VPC ID is required"
    exit 1
fi

# Get Subnet ID
read -p "Enter Subnet ID to use: " SUBNET_ID
if [ -z "$SUBNET_ID" ]; then
    print_error "Subnet ID is required"
    exit 1
fi

# Get Key Pair Name
read -p "Enter Key Pair Name to use: " KEY_PAIR_NAME
if [ -z "$KEY_PAIR_NAME" ]; then
    print_error "Key Pair Name is required"
    exit 1
fi

# Get Instance Type
read -p "Enter Instance Type (default: t3.medium): " INSTANCE_TYPE
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.medium}

echo ""
print_status "Updating deployment scripts with your configuration..."

# Update CloudFormation deployment script
sed -i.bak "s/KEY_PAIR_NAME=\"your-key-pair-name\"/KEY_PAIR_NAME=\"$KEY_PAIR_NAME\"/" scripts/deploy-app2-cloudformation.sh
sed -i.bak "s/VPC_ID=\"vpc-xxxxxxxxx\"/VPC_ID=\"$VPC_ID\"/" scripts/deploy-app2-cloudformation.sh
sed -i.bak "s/SUBNET_ID=\"subnet-xxxxxxxxx\"/SUBNET_ID=\"$SUBNET_ID\"/" scripts/deploy-app2-cloudformation.sh
sed -i.bak "s/INSTANCE_TYPE=\"t3.medium\"/INSTANCE_TYPE=\"$INSTANCE_TYPE\"/" scripts/deploy-app2-cloudformation.sh

print_success "✓ Configuration updated in deployment scripts"
echo ""

# Display next steps
print_success "🎉 Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Review the configuration in scripts/deploy-app2-cloudformation.sh"
echo "2. Deploy the infrastructure: ./scripts/deploy-app2-cloudformation.sh"
echo "3. After infrastructure is ready, deploy the app: ./scripts/deploy-app2-ec2.sh"
echo ""
print_status "Configuration Summary:"
echo "  VPC ID: $VPC_ID"
echo "  Subnet ID: $SUBNET_ID"
echo "  Key Pair: $KEY_PAIR_NAME"
echo "  Instance Type: $INSTANCE_TYPE"
echo "  AWS Region: $AWS_REGION"
echo ""

print_status "Ready to deploy! 🚀"

#!/bin/bash

# ========================================
# APP2 CLOUDFORMATION DEPLOYMENT SCRIPT
# ========================================

set -e  # Exit on any error

echo "🚀 Deploying App2 CloudFormation Stack..."

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

# Configuration - UPDATE THESE VALUES
STACK_NAME="app2-ec2-stack"
REGION="us-east-1"
KEY_PAIR_NAME="your-key-pair-name"  # Update this with your actual key pair name
VPC_ID="vpc-xxxxxxxxx"              # Update this with your actual VPC ID
SUBNET_ID="subnet-xxxxxxxxx"        # Update this with your actual subnet ID
INSTANCE_TYPE="t3.medium"           # Reasonable size for testing

# Check if required variables are set
if [ "$KEY_PAIR_NAME" = "your-key-pair-name" ]; then
    print_error "Please update KEY_PAIR_NAME in this script with your actual EC2 key pair name"
    exit 1
fi

if [ "$VPC_ID" = "vpc-xxxxxxxxx" ]; then
    print_error "Please update VPC_ID in this script with your actual VPC ID"
    exit 1
fi

if [ "$SUBNET_ID" = "subnet-xxxxxxxxx" ]; then
    print_error "Please update SUBNET_ID in this script with your actual subnet ID"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Deploying CloudFormation stack: $STACK_NAME"
print_status "Region: $REGION"
print_status "Key Pair: $KEY_PAIR_NAME"
print_status "VPC ID: $VPC_ID"
print_status "Subnet ID: $SUBNET_ID"
print_status "Instance Type: $INSTANCE_TYPE"

# Check if stack already exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
    print_warning "Stack $STACK_NAME already exists. Updating..."
    OPERATION="update-stack"
else
    print_status "Creating new stack $STACK_NAME..."
    OPERATION="create-stack"
fi

# Deploy the CloudFormation stack
print_status "Deploying CloudFormation stack..."
aws cloudformation "$OPERATION" \
    --stack-name "$STACK_NAME" \
    --template-body file://infrastructure/app2-ec2.yaml \
    --parameters \
        ParameterKey=KeyPairName,ParameterValue="$KEY_PAIR_NAME" \
        ParameterKey=VpcId,ParameterValue="$VPC_ID" \
        ParameterKey=SubnetId,ParameterValue="$SUBNET_ID" \
        ParameterKey=InstanceType,ParameterValue="$INSTANCE_TYPE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION"

# Wait for stack to complete
print_status "Waiting for stack operation to complete..."
if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
else
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
fi

# Get stack outputs
print_status "Getting stack outputs..."
STACK_OUTPUTS=$(aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION")

# Extract important values
INSTANCE_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="InstanceId") | .OutputValue')
PUBLIC_IP=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="PublicIP") | .OutputValue')
SECURITY_GROUP_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="SecurityGroupId") | .OutputValue')
APP_URL=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApplicationURL") | .OutputValue')

print_success "🎉 CloudFormation stack deployed successfully!"
print_status "Stack Name: $STACK_NAME"
print_status "Instance ID: $INSTANCE_ID"
print_status "Public IP: $PUBLIC_IP"
print_status "Security Group ID: $SECURITY_GROUP_ID"
print_status "Application URL: $APP_URL"

# Wait for instance to be ready
print_status "Waiting for EC2 instance to be ready..."
aws ec2 wait instance-running \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION"

print_status "EC2 instance is now running!"

# Update the deployment script with the actual EC2 IP
print_status "Updating deployment script with EC2 IP..."
sed -i.bak "s/EC2_HOST=\"your-ec2-ip-here\"/EC2_HOST=\"$PUBLIC_IP\"/" scripts/deploy-app2-ec2.sh
sed -i.bak "s/GITHUB_REPO=\"your-username\/app2\"/GITHUB_REPO=\"zettaform\/app2\"/" scripts/deploy-app2-ec2.sh

print_success "Deployment script updated with EC2 IP: $PUBLIC_IP"

# Display next steps
echo ""
print_status "Next steps:"
print_status "1. Wait a few minutes for the EC2 instance to fully initialize"
print_status "2. Test SSH connection: ssh -i ~/.ssh/$KEY_PAIR_NAME.pem ec2-user@$PUBLIC_IP"
print_status "3. Deploy the application: ./scripts/deploy-app2-ec2.sh"
print_status "4. Access the application at: $APP_URL"
echo ""

print_success "🎉 App2 infrastructure deployment completed!"

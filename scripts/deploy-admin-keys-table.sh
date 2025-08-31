#!/bin/bash

# Deploy Admin Keys DynamoDB Table
# This script creates the admin keys table for managing API keys with usage limits

set -e

echo "🚀 Deploying Admin Keys DynamoDB Table..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Configuration
STACK_NAME="admin-keys-table"
REGION="us-east-1"
TEMPLATE_FILE="infrastructure/admin-keys-table.yaml"

echo "📋 Configuration:"
echo "   Stack Name: $STACK_NAME"
echo "   Region: $REGION"
echo "   Template: $TEMPLATE_FILE"

# Check if stack already exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo "🔄 Stack already exists. Updating..."
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --region $REGION \
        --capabilities CAPABILITY_IAM
    
    echo "⏳ Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME \
        --region $REGION
else
    echo "🆕 Creating new stack..."
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --region $REGION \
        --capabilities CAPABILITY_IAM
    
    echo "⏳ Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $REGION
fi

# Get stack outputs
echo "📊 Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output table

echo "✅ Admin Keys DynamoDB Table deployed successfully!"
echo ""
echo "🔑 Next steps:"
echo "   1. Update your .env file with the table name"
echo "   2. Restart your server to use the new table"
echo "   3. Create initial admin keys through the admin interface"

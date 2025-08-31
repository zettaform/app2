#!/bin/bash

# Deploy External User Creation Logs DynamoDB Table
# This script deploys or updates the CloudFormation stack for the logs table

set -e

# Configuration
STACK_NAME="external-user-logs-table"
TEMPLATE_FILE="infrastructure/external-user-logs-table.yaml"
ENVIRONMENT=${1:-"dev"}

echo "🚀 Deploying External User Creation Logs Table..."
echo "Environment: $ENVIRONMENT"
echo "Stack Name: $STACK_NAME"
echo "Template: $TEMPLATE_FILE"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials verified"
echo ""

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
    echo "📝 Stack exists, updating..."
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM
    
    echo "⏳ Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME
    echo "✅ Stack updated successfully!"
else
    echo "🆕 Stack does not exist, creating..."
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM
    
    echo "⏳ Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
    echo "✅ Stack created successfully!"
fi

echo ""
echo "📊 Stack Details:"
aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs' --output table

echo ""
echo "🎉 External User Creation Logs Table deployment completed!"
echo "Table Name: $ENVIRONMENT-external-user-creation-logs"

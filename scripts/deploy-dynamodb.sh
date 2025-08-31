#!/bin/bash

# DynamoDB Tables Deployment Script
# This script deploys the DynamoDB tables using AWS CloudFormation

set -e

# Configuration
STACK_NAME="react-template-dynamodb"
TEMPLATE_FILE="infrastructure/dynamodb-tables.yaml"
REGION="us-east-1"
ENVIRONMENT="dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting DynamoDB Tables Deployment${NC}"
echo "=================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Deploying CloudFormation stack: ${STACK_NAME}${NC}"
echo -e "${YELLOW}🌍 Region: ${REGION}${NC}"
echo -e "${YELLOW}🏷️  Environment: ${ENVIRONMENT}${NC}"

# Deploy the CloudFormation stack
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides Environment="$ENVIRONMENT" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DynamoDB tables deployed successfully!${NC}"
    
    # Get stack outputs
    echo -e "${YELLOW}📊 Stack Outputs:${NC}"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

#!/bin/bash
set -e

STACK_NAME="react-template-s3-avatars"
TEMPLATE_FILE="infrastructure/s3-avatars.yaml"
REGION="us-east-1"
ENVIRONMENT="dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying S3 Bucket for Dragon Ball Z Avatars...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI and credentials verified${NC}"

# Deploy CloudFormation stack
echo -e "${YELLOW}📦 Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides Environment="$ENVIRONMENT" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION"

echo -e "${GREEN}✅ S3 bucket deployed successfully!${NC}"

# Get bucket name from stack output
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`AvatarsBucketName`].OutputValue' \
    --output text)

echo -e "${BLUE}📦 S3 Bucket Name: ${BUCKET_NAME}${NC}"

# Upload Dragon Ball Z avatars to S3
echo -e "${YELLOW}🖼️  Uploading Dragon Ball Z avatars to S3...${NC}"

# Check if public/dbz directory exists
if [ ! -d "public/dbz" ]; then
    echo -e "${RED}❌ public/dbz directory not found. Please ensure Dragon Ball Z images are in public/dbz/${NC}"
    exit 1
fi

# Upload each avatar
for file in public/dbz/*.png; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo -e "${BLUE}📤 Uploading $filename...${NC}"
        aws s3 cp "$file" "s3://$BUCKET_NAME/dbz/$filename" \
            --acl public-read \
            --region "$REGION"
        echo -e "${GREEN}✅ $filename uploaded successfully${NC}"
    fi
done

echo -e "${GREEN}🎉 All Dragon Ball Z avatars uploaded to S3!${NC}"
echo -e "${BLUE}🌐 Avatar URLs: https://$BUCKET_NAME.s3.amazonaws.com/dbz/${NC}"

# Test access to a few avatars
echo -e "${YELLOW}🧪 Testing avatar access...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://$BUCKET_NAME.s3.amazonaws.com/dbz/goku.png" | grep -q "200"; then
    echo -e "${GREEN}✅ Avatar access test successful${NC}"
else
    echo -e "${RED}❌ Avatar access test failed${NC}"
fi

echo -e "${GREEN}🎯 S3 Avatar setup complete!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Update your React app to use S3 avatar URLs"
echo -e "   2. Test avatar display in the UI"
echo -e "   3. Verify avatars appear in header and customers page"

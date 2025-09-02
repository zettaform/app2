#!/bin/bash

echo "🔍 GITHUB SECRETS VALIDATION"
echo "============================="
echo ""

# Check required secrets
echo "📋 Checking GitHub secrets availability..."
echo ""

if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "✅ AWS_ACCESS_KEY_ID: CONFIGURED"
else
  echo "❌ AWS_ACCESS_KEY_ID: NOT SET"
fi

if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "✅ AWS_SECRET_ACCESS_KEY: CONFIGURED"
else
  echo "❌ AWS_SECRET_ACCESS_KEY: NOT SET"
fi

if [ -n "$JWT_SECRET" ]; then
  echo "✅ JWT_SECRET: CONFIGURED"
  JWT_LENGTH=${#JWT_SECRET}
  if [ $JWT_LENGTH -ge 32 ]; then
    echo "✅ JWT_SECRET length: $JWT_LENGTH characters (valid)"
  else
    echo "❌ JWT_SECRET length: $JWT_LENGTH characters (minimum 32 required)"
  fi
else
  echo "❌ JWT_SECRET: NOT SET"
fi

if [ -n "$ADMIN_GLOBAL_KEY" ]; then
  echo "✅ ADMIN_GLOBAL_KEY: CONFIGURED"
else
  echo "❌ ADMIN_GLOBAL_KEY: NOT SET"
fi

if [ -n "$PASSWORD_SALT" ]; then
  echo "✅ PASSWORD_SALT: CONFIGURED"
else
  echo "❌ PASSWORD_SALT: NOT SET"
fi

if [ -n "$EC2_SSH_PRIVATE_KEY" ]; then
  echo "✅ EC2_SSH_PRIVATE_KEY: CONFIGURED"
else
  echo "❌ EC2_SSH_PRIVATE_KEY: NOT SET"
fi

if [ -n "$EC2_HOST" ]; then
  echo "✅ EC2_HOST: CONFIGURED"
else
  echo "❌ EC2_HOST: NOT SET"
fi

if [ -n "$EC2_USER" ]; then
  echo "✅ EC2_USER: CONFIGURED"
else
  echo "❌ EC2_USER: NOT SET"
fi

echo ""
echo "💡 If any secrets show as 'NOT SET', configure them in:"
echo "   GitHub Repository → Settings → Secrets and variables → Actions"
echo ""
echo "🚀 Environment validation complete!"

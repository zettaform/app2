#!/usr/bin/env node

/**
 * Environment Secrets Validation Script
 * Validates that all required environment variables are properly configured
 * for production deployment to EC2
 */

import { ENV_CONFIG, ENV_VALIDATION } from '../src/config/environment.js';

console.log('🔍 ENVIRONMENT SECRETS VALIDATION');
console.log('==================================');
console.log('');

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log('');

// Display current validation results
console.log('📋 VALIDATION RESULTS:');
console.log(`Overall Status: ${ENV_VALIDATION.isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log('');

if (ENV_VALIDATION.errors.length > 0) {
  console.log('❌ ERRORS:');
  ENV_VALIDATION.errors.forEach(error => {
    console.log(`  - ${error}`);
  });
  console.log('');
}

if (ENV_VALIDATION.warnings.length > 0) {
  console.log('⚠️ WARNINGS:');
  ENV_VALIDATION.warnings.forEach(warning => {
    console.log(`  - ${warning}`);
  });
  console.log('');
}

// Check critical environment variables
console.log('🔑 CRITICAL ENVIRONMENT VARIABLES:');
console.log('===================================');

const criticalVars = [
  { name: 'AWS_ACCESS_KEY_ID', value: ENV_CONFIG.AWS.ACCESS_KEY_ID, required: true },
  { name: 'AWS_SECRET_ACCESS_KEY', value: ENV_CONFIG.AWS.SECRET_ACCESS_KEY, required: true },
  { name: 'JWT_SECRET', value: ENV_CONFIG.SECURITY.JWT_SECRET, required: isProduction },
  { name: 'ADMIN_GLOBAL_KEY', value: ENV_CONFIG.SECURITY.ADMIN_GLOBAL_KEY, required: isProduction },
  { name: 'NODE_ENV', value: ENV_CONFIG.NODE_ENV, required: true },
  { name: 'PORT', value: ENV_CONFIG.PORT, required: true },
  { name: 'ENVIRONMENT', value: ENV_CONFIG.ENVIRONMENT, required: true }
];

criticalVars.forEach(({ name, value, required }) => {
  const status = value ? '✅' : '❌';
  const requiredText = required ? '(REQUIRED)' : '(OPTIONAL)';
  const displayValue = value ? (name.includes('SECRET') || name.includes('KEY') ? '***HIDDEN***' : value) : 'NOT SET';
  
  console.log(`${status} ${name}: ${displayValue} ${requiredText}`);
});

console.log('');

// Check JWT secret strength
if (ENV_CONFIG.SECURITY.JWT_SECRET) {
  const jwtLength = ENV_CONFIG.SECURITY.JWT_SECRET.length;
  const jwtStatus = jwtLength >= 32 ? '✅' : '❌';
  console.log(`${jwtStatus} JWT_SECRET Length: ${jwtLength} characters (minimum 32 required)`);
}

console.log('');

// Check AWS configuration
console.log('☁️ AWS CONFIGURATION:');
console.log('=====================');
console.log(`✅ AWS Region: ${ENV_CONFIG.AWS.REGION}`);
console.log(`✅ Default Region: ${ENV_CONFIG.AWS.DEFAULT_REGION}`);

console.log('');

// Check DynamoDB table configuration
console.log('🗄️ DYNAMODB TABLES:');
console.log('===================');
Object.entries(ENV_CONFIG.TABLES).forEach(([key, value]) => {
  console.log(`✅ ${key}: ${value}`);
});

console.log('');

// Check CORS configuration
console.log('🌐 CORS CONFIGURATION:');
console.log('======================');
console.log(`✅ Allowed Origins: ${ENV_CONFIG.CORS.ORIGIN.join(', ')}`);

console.log('');

// Check EC2 configuration
console.log('🖥️ EC2 CONFIGURATION:');
console.log('=====================');
console.log(`✅ EC2 Host: ${ENV_CONFIG.EC2.HOST || 'NOT SET'}`);
console.log(`✅ EC2 User: ${ENV_CONFIG.EC2.USER}`);
console.log(`✅ SSH Key Path: ${ENV_CONFIG.EC2.SSH_KEY_PATH || 'NOT SET'}`);

console.log('');

// Summary and recommendations
console.log('📝 SUMMARY & RECOMMENDATIONS:');
console.log('==============================');

if (ENV_VALIDATION.isValid) {
  console.log('✅ Environment configuration is valid!');
  console.log('✅ Ready for deployment to EC2');
} else {
  console.log('❌ Environment configuration has issues that need to be fixed:');
  console.log('');
  
  if (ENV_VALIDATION.errors.length > 0) {
    console.log('🔧 REQUIRED FIXES:');
    ENV_VALIDATION.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }
  
  if (ENV_VALIDATION.warnings.length > 0) {
    console.log('');
    console.log('⚠️ RECOMMENDED FIXES:');
    ENV_VALIDATION.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  console.log('');
  console.log('💡 TO FIX THESE ISSUES:');
  console.log('1. Ensure all required GitHub secrets are configured');
  console.log('2. Verify JWT_SECRET is at least 32 characters long');
  console.log('3. Set ADMIN_GLOBAL_KEY for production deployments');
  console.log('4. Check that AWS credentials are valid and have proper permissions');
}

console.log('');
console.log('🚀 NEXT STEPS:');
console.log('1. Fix any validation errors above');
console.log('2. Test the deployment workflow');
console.log('3. Verify the application starts successfully on EC2');
console.log('4. Test external connectivity to port 3001');

// Exit with appropriate code
process.exit(ENV_VALIDATION.isValid ? 0 : 1);
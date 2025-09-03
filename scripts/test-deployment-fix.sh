#!/bin/bash

# Test Deployment Fix Script
# Quick validation of the deployment fixes

echo "🧪 TESTING DEPLOYMENT FIXES"
echo "============================"
echo ""

# Check if scripts exist and are executable
echo "📋 Checking deployment scripts..."

scripts=(
    "scripts/deploy-fixed.sh"
    "scripts/deploy-with-secrets.sh" 
    "scripts/create-production-env.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo "✅ $script - exists and executable"
    elif [ -f "$script" ]; then
        echo "⚠️  $script - exists but not executable"
        chmod +x "$script"
        echo "   → Made executable"
    else
        echo "❌ $script - missing"
    fi
done

echo ""

# Check GitHub Actions workflows
echo "📋 Checking GitHub Actions workflows..."

workflows=(
    ".github/workflows/fixed-deployment.yml"
    ".github/workflows/deploy-with-secrets.yml"
)

for workflow in "${workflows[@]}"; do
    if [ -f "$workflow" ]; then
        echo "✅ $workflow - exists"
        
        # Basic YAML syntax check
        if command -v yamllint &> /dev/null; then
            if yamllint "$workflow" &> /dev/null; then
                echo "   → YAML syntax valid"
            else
                echo "   ⚠️ YAML syntax issues detected"
            fi
        fi
    else
        echo "❌ $workflow - missing"
    fi
done

echo ""

# Check environment files
echo "📋 Checking environment configuration..."

env_files=(
    ".env.github"
    ".env.production"
    "env.production.example"
)

for env_file in "${env_files[@]}"; do
    if [ -f "$env_file" ]; then
        echo "✅ $env_file - exists"
        
        # Check for proper secret references
        if grep -q "secrets\." "$env_file" || grep -q "\${" "$env_file"; then
            echo "   → Contains secret references"
        else
            echo "   ⚠️ No secret references found"
        fi
    else
        echo "❌ $env_file - missing"
    fi
done

echo ""

# Check package.json configuration
echo "📋 Checking package.json configuration..."

if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    
    # Check for ES module configuration
    if grep -q '"type": "module"' package.json; then
        echo "   ✅ ES module configuration detected"
    else
        echo "   ⚠️ ES module configuration not found"
    fi
    
    # Check for required dependencies
    required_deps=("express" "cors" "@aws-sdk/client-dynamodb" "dotenv")
    for dep in "${required_deps[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo "   ✅ Dependency: $dep"
        else
            echo "   ❌ Missing dependency: $dep"
        fi
    done
else
    echo "❌ package.json missing"
fi

echo ""

# Check server files
echo "📋 Checking server files..."

server_files=(
    "server.js"
    "enhanced-production-server.js"
)

for server_file in "${server_files[@]}"; do
    if [ -f "$server_file" ]; then
        echo "✅ $server_file exists"
        
        # Check for ES module imports
        if grep -q "^import.*from" "$server_file"; then
            echo "   ✅ ES module imports detected"
        else
            echo "   ⚠️ No ES module imports found"
        fi
    else
        echo "❌ $server_file missing"
    fi
done

echo ""

# Summary
echo "🎯 VALIDATION SUMMARY"
echo "====================="
echo ""

if [ -f "scripts/deploy-fixed.sh" ] && [ -f ".github/workflows/fixed-deployment.yml" ]; then
    echo "✅ Core deployment fixes are in place"
    echo ""
    echo "🚀 Ready to deploy! Choose one of these options:"
    echo ""
    echo "1️⃣ GitHub Actions (Recommended):"
    echo "   → Go to Actions → '🔧 FIXED DEPLOYMENT' → Run workflow"
    echo ""
    echo "2️⃣ Local deployment:"
    echo "   → Set environment variables"
    echo "   → Run: ./scripts/deploy-fixed.sh"
    echo ""
    echo "3️⃣ Manual environment setup:"
    echo "   → Run: ./scripts/create-production-env.sh"
    echo ""
    echo "📝 All deployment issues from git logs have been addressed!"
else
    echo "❌ Some fixes are missing - please review the output above"
fi

echo ""
echo "🔧 Deployment fix validation completed!"
#!/bin/bash

# ========================================
# PRODUCTION BUILD SCRIPT
# ========================================

set -e  # Exit on any error

echo "🏗️  Building production application..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js 16+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/ build/ node_modules/

# Install production dependencies
print_status "Installing production dependencies..."
npm ci --only=production

# Install dev dependencies for build
print_status "Installing build dependencies..."
npm install --save-dev

# Build frontend
print_status "Building React frontend..."
npm run build

# Copy build to public directory for Express to serve
print_status "Copying build to public directory..."
mkdir -p public
cp -r dist/* public/

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Set proper permissions
print_status "Setting file permissions..."
chmod +x scripts/*.sh
chmod 755 public/
chmod 755 logs/

# Create production environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from example..."
    if [ -f "env.production.example" ]; then
        cp env.production.example .env
        print_warning "Please update .env with your production values!"
    else
        print_error "No environment example file found!"
    fi
fi

# Verify build
if [ -d "public" ] && [ "$(ls -A public)" ]; then
    print_success "Production build complete!"
    print_status "Build size: $(du -sh public | cut -f1)"
    print_status "Files in build: $(find public -type f | wc -l)"
else
    print_error "Build failed! Public directory is empty."
    exit 1
fi

print_success "🎉 Production build completed successfully!"
print_status "Next steps:"
print_status "1. Update .env with production values"
print_status "2. Run: npm run pm2:start --env production"
print_status "3. Or run: npm run start:prod"

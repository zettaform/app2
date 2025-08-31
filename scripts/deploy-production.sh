#!/bin/bash

# ========================================
# PRODUCTION DEPLOYMENT SCRIPT
# ========================================
# This script deploys the application to production EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="mosaic-react"
DEPLOY_DIR="/opt/mosaic-react"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/mosaic-deploy.log"
PM2_APP_NAME="mosaic-react-backend"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check if required commands exist
command -v node >/dev/null 2>&1 || error "Node.js is not installed"
command -v npm >/dev/null 2>&1 || error "npm is not installed"
command -v pm2 >/dev/null 2>&1 || error "PM2 is not installed"

log "Starting production deployment for $APP_NAME"

# Create deployment directory if it doesn't exist
if [ ! -d "$DEPLOY_DIR" ]; then
    log "Creating deployment directory: $DEPLOY_DIR"
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR"
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
fi

# Create log file if it doesn't exist
sudo touch "$LOG_FILE"
sudo chown $USER:$USER "$LOG_FILE"

# Backup current deployment
if [ -d "$DEPLOY_DIR/current" ]; then
    log "Creating backup of current deployment"
    BACKUP_NAME="$BACKUP_DIR/${APP_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$DEPLOY_DIR/current" "$BACKUP_NAME"
    success "Backup created: $BACKUP_NAME"
fi

# Stop PM2 process if running
if pm2 list | grep -q "$PM2_APP_NAME"; then
    log "Stopping PM2 process: $PM2_APP_NAME"
    pm2 stop "$PM2_APP_NAME" || warning "Failed to stop PM2 process"
fi

# Clean deployment directory
log "Cleaning deployment directory"
rm -rf "$DEPLOY_DIR/current"
mkdir -p "$DEPLOY_DIR/current"

# Copy application files
log "Copying application files"
cp -r . "$DEPLOY_DIR/current/"
cd "$DEPLOY_DIR/current"

# Remove unnecessary files
log "Cleaning unnecessary files"
rm -rf node_modules package-lock.json .git .github .vscode .DS_Store

# Install production dependencies
log "Installing production dependencies"
npm ci --only=production || error "Failed to install production dependencies"

# Build frontend for production
log "Building frontend for production"
export NODE_ENV=production
export REACT_APP_ENVIRONMENT=prod
npm run build:prod || error "Failed to build frontend"

# Copy environment file
if [ -f "env.production" ]; then
    log "Setting up production environment"
    cp env.production .env
else
    warning "Production environment file not found, using development"
    cp env.development .env
fi

# Create logs directory
mkdir -p logs

# Start PM2 process
log "Starting PM2 process"
pm2 start ecosystem.config.js --env production || error "Failed to start PM2 process"

# Save PM2 configuration
pm2 save || warning "Failed to save PM2 configuration"

# Setup PM2 startup script
pm2 startup || warning "Failed to setup PM2 startup script"

# Wait for application to start
log "Waiting for application to start"
sleep 5

# Check if application is running
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    success "Application deployed successfully!"
    
    # Get application status
    log "Application status:"
    pm2 show "$PM2_APP_NAME" | grep -E "(status|port|memory|cpu)" || true
    
    # Show logs
    log "Recent application logs:"
    pm2 logs "$PM2_APP_NAME" --lines 10 || true
    
else
    error "Application failed to start"
fi

# Cleanup old backups (keep last 5)
log "Cleaning up old backups"
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf

log "Deployment completed successfully!"
success "Application is now running in production mode"

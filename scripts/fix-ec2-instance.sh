#!/bin/bash

# ========================================
# EC2 INSTANCE DIAGNOSTIC AND FIX SCRIPT
# ========================================

set -e

echo "🔧 EC2 Instance Diagnostic and Fix Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
EC2_HOST="52.70.4.30"
EC2_USER="ec2-user"
SSH_KEY_PATH="~/.ssh/app2-key-pair.pem"

print_status "Diagnosing EC2 instance: $EC2_HOST"

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    print_error "SSH key not found at $SSH_KEY_PATH"
    print_status "Please ensure you have the SSH key for this EC2 instance"
    exit 1
fi

print_status "SSH key found, proceeding with diagnosis..."

# Test SSH connection
print_status "Testing SSH connection..."
if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'"; then
    print_success "SSH connection successful"
else
    print_error "SSH connection failed"
    exit 1
fi

# Run diagnostic commands on EC2
print_status "Running diagnostic commands on EC2 instance..."

ssh -i "$SSH_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
    echo "🔍 EC2 INSTANCE DIAGNOSTIC REPORT"
    echo "=================================="
    echo ""
    
    # System information
    echo "📊 SYSTEM INFORMATION:"
    echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "  Kernel: $(uname -r)"
    echo "  Architecture: $(uname -m)"
    echo "  Uptime: $(uptime)"
    echo ""
    
    # Disk space
    echo "💾 DISK SPACE:"
    df -h
    echo ""
    
    # Memory
    echo "🧠 MEMORY:"
    free -h
    echo ""
    
    # Docker status
    echo "🐳 DOCKER STATUS:"
    if command -v docker &> /dev/null; then
        echo "  Docker installed: ✅"
        docker --version
        echo ""
        echo "  Docker service status:"
        sudo systemctl status docker --no-pager || echo "  Docker service not running"
        echo ""
        echo "  Docker containers:"
        docker ps -a || echo "  No containers found"
        echo ""
        echo "  Docker images:"
        docker images || echo "  No images found"
    else
        echo "  Docker installed: ❌"
        echo "  This is likely the cause of deployment failure!"
    fi
    echo ""
    
    # Network connectivity
    echo "🌐 NETWORK CONNECTIVITY:"
    echo "  Internet connectivity:"
    ping -c 3 8.8.8.8 || echo "  ❌ No internet connectivity"
    echo ""
    echo "  Docker Hub connectivity:"
    ping -c 3 registry-1.docker.io || echo "  ❌ Cannot reach Docker Hub"
    echo ""
    
    # User permissions
    echo "👤 USER PERMISSIONS:"
    echo "  Current user: $(whoami)"
    echo "  User groups: $(groups)"
    echo "  Docker group membership: $(groups | grep -q docker && echo '✅' || echo '❌')"
    echo ""
    
    # Directory permissions
    echo "📁 DIRECTORY PERMISSIONS:"
    echo "  Home directory: $(ls -la /home/ec2-user | head -5)"
    echo "  Write permissions: $(test -w /home/ec2-user && echo '✅' || echo '❌')"
    echo ""
    
    # Recent logs
    echo "📋 RECENT SYSTEM LOGS:"
    echo "  Last 10 system messages:"
    sudo journalctl -n 10 --no-pager || echo "  Cannot access system logs"
    echo ""
    
    echo "🔧 RECOMMENDED FIXES:"
    echo "====================="
    
    if ! command -v docker &> /dev/null; then
        echo "1. Install Docker:"
        echo "   sudo yum update -y"
        echo "   sudo yum install -y docker"
        echo "   sudo systemctl start docker"
        echo "   sudo systemctl enable docker"
        echo "   sudo usermod -a -G docker ec2-user"
        echo ""
    fi
    
    if ! groups | grep -q docker; then
        echo "2. Add user to docker group:"
        echo "   sudo usermod -a -G docker ec2-user"
        echo "   (Note: User needs to logout/login for changes to take effect)"
        echo ""
    fi
    
    echo "3. Test Docker installation:"
    echo "   docker --version"
    echo "   docker run hello-world"
    echo ""
    
    echo "4. Check disk space:"
    echo "   df -h"
    echo "   (Ensure at least 2GB free space)"
    echo ""
    
    echo "✅ DIAGNOSTIC COMPLETE"
EOF

print_success "Diagnostic completed. Check the output above for issues and recommended fixes."
print_status "If Docker is not installed, that's likely the cause of deployment failure."
print_status "Run the recommended commands on the EC2 instance to fix the issues."
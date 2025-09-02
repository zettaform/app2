#!/bin/bash

# ========================================
# EC2 INSTANCE FIX SCRIPT FOR GITHUB ACTIONS
# ========================================

set -e

echo "🔧 Fixing EC2 Instance via GitHub Actions"
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

print_status "Starting EC2 instance fix process..."

# Test SSH connection first
print_status "Testing SSH connection..."
if ! ssh -i ~/.ssh/app2-key-pair.pem -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} "echo 'SSH connection successful'"; then
    print_error "SSH connection failed!"
    exit 1
fi
print_success "SSH connection successful"

# Run comprehensive fix on EC2 instance
print_status "Running comprehensive EC2 instance fix..."
ssh -i ~/.ssh/app2-key-pair.pem ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << 'EOF'
    echo "🔧 COMPREHENSIVE EC2 INSTANCE FIX"
    echo "=================================="
    
    # Update system
    echo "📦 Updating system packages..."
    sudo yum update -y
    
    # Install Docker if not present
    echo "🐳 Installing Docker..."
    if ! command -v docker &> /dev/null; then
        echo "Docker not found, installing..."
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        echo "✅ Docker installed and started"
    else
        echo "✅ Docker already installed"
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    # Add user to docker group
    echo "👤 Adding user to docker group..."
    sudo usermod -a -G docker ec2-user
    echo "✅ User added to docker group"
    
    # Install Docker Compose if not present
    echo "🐳 Installing Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "✅ Docker Compose installed"
    else
        echo "✅ Docker Compose already installed"
    fi
    
    # Clean up any existing containers and images
    echo "🧹 Cleaning up existing Docker resources..."
    docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"
    docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
    docker rmi $(docker images -q) 2>/dev/null || echo "No images to remove"
    docker system prune -af 2>/dev/null || echo "Docker system cleanup completed"
    
    # Test Docker installation
    echo "🧪 Testing Docker installation..."
    if docker --version; then
        echo "✅ Docker version check passed"
    else
        echo "❌ Docker version check failed"
        exit 1
    fi
    
    # Test Docker daemon
    echo "🧪 Testing Docker daemon..."
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker daemon is running"
    else
        echo "❌ Docker daemon is not running"
        sudo systemctl restart docker
        sleep 5
        if docker info >/dev/null 2>&1; then
            echo "✅ Docker daemon restarted successfully"
        else
            echo "❌ Docker daemon still not running"
            exit 1
        fi
    fi
    
    # Test Docker with hello-world
    echo "🧪 Testing Docker with hello-world..."
    if docker run --rm hello-world >/dev/null 2>&1; then
        echo "✅ Docker hello-world test passed"
    else
        echo "❌ Docker hello-world test failed"
        exit 1
    fi
    
    # Check disk space
    echo "💾 Checking disk space..."
    df -h
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2000000 ]; then
        echo "⚠️ Warning: Low disk space ($AVAILABLE_SPACE KB available)"
        echo "Cleaning up temporary files..."
        sudo rm -rf /tmp/*
        sudo yum clean all
        echo "✅ Cleanup completed"
    else
        echo "✅ Sufficient disk space available"
    fi
    
    # Check memory
    echo "🧠 Checking memory..."
    free -h
    
    # Ensure proper permissions
    echo "🔐 Setting up permissions..."
    sudo chown -R ec2-user:ec2-user /home/ec2-user
    chmod 755 /home/ec2-user
    
    # Create necessary directories
    echo "📁 Creating necessary directories..."
    mkdir -p /home/ec2-user/logs
    mkdir -p /home/ec2-user/app2
    
    echo "✅ EC2 instance fix completed successfully!"
    echo ""
    echo "📊 FINAL STATUS:"
    echo "  Docker installed: $(command -v docker >/dev/null && echo '✅' || echo '❌')"
    echo "  Docker running: $(docker info >/dev/null 2>&1 && echo '✅' || echo '❌')"
    echo "  Docker Compose: $(command -v docker-compose >/dev/null && echo '✅' || echo '❌')"
    echo "  User in docker group: $(groups | grep -q docker && echo '✅' || echo '❌')"
    echo "  Disk space: $(df -h / | tail -1 | awk '{print $4}') available"
    echo "  Memory: $(free -h | grep Mem | awk '{print $7}') available"
EOF

if [ $? -eq 0 ]; then
    print_success "EC2 instance fix completed successfully!"
else
    print_error "EC2 instance fix failed!"
    exit 1
fi

print_status "EC2 instance is now ready for deployment!"
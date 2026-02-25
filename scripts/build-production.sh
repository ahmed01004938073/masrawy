#!/bin/bash

# Production Build Script for Afleet Store
echo "🚀 Starting production build for Afleet Store..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Run tests (if available)
print_status "Running tests..."
npm test -- --coverage --watchAll=false --passWithNoTests

if [ $? -ne 0 ]; then
    print_warning "Tests failed, but continuing with build..."
fi

# Run linting
print_status "Running linting..."
npm run lint --if-present

if [ $? -ne 0 ]; then
    print_warning "Linting issues found, but continuing with build..."
fi

# Clean previous build
print_status "Cleaning previous build..."
rm -rf build dist

# Set production environment
export NODE_ENV=production
export REACT_APP_ENVIRONMENT=production

# Build the application
print_status "Building application for production..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Build completed successfully"

# Check build size
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_status "Build size: $BUILD_SIZE"
fi

# Generate build report
print_status "Generating build report..."
if [ -f "build/static/js/main.*.js" ]; then
    JS_SIZE=$(ls -lah build/static/js/main.*.js | awk '{print $5}')
    print_status "Main JS bundle size: $JS_SIZE"
fi

if [ -f "build/static/css/main.*.css" ]; then
    CSS_SIZE=$(ls -lah build/static/css/main.*.css | awk '{print $5}')
    print_status "Main CSS bundle size: $CSS_SIZE"
fi

# Security check
print_status "Running security audit..."
npm audit --audit-level=high

if [ $? -ne 0 ]; then
    print_warning "Security vulnerabilities found. Please review and fix them."
fi

# Create deployment info
print_status "Creating deployment info..."
cat > build/deployment-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$NODE_VERSION",
  "environment": "production",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Performance recommendations
print_status "Performance recommendations:"
echo "  • Enable gzip compression on your server"
echo "  • Set proper cache headers for static assets"
echo "  • Use a CDN for static assets"
echo "  • Enable HTTP/2 on your server"
echo "  • Consider using a service worker for caching"

# Security recommendations
print_status "Security recommendations:"
echo "  • Enable HTTPS with a valid SSL certificate"
echo "  • Set security headers (CSP, HSTS, etc.)"
echo "  • Regularly update dependencies"
echo "  • Use environment variables for sensitive data"
echo "  • Enable rate limiting on your server"

# Deployment instructions
print_status "Deployment instructions:"
echo "  1. Upload the 'build' folder contents to your web server"
echo "  2. Configure your server to serve index.html for all routes"
echo "  3. Set up proper cache headers for static assets"
echo "  4. Configure SSL certificate"
echo "  5. Test the deployment thoroughly"

print_success "Production build completed! 🎉"
print_status "Build files are ready in the 'build' directory"

# Optional: Create a deployment package
read -p "Do you want to create a deployment package? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating deployment package..."
    tar -czf "afleet-store-$(date +%Y%m%d-%H%M%S).tar.gz" -C build .
    print_success "Deployment package created successfully"
fi

echo "🚀 Build process completed!"

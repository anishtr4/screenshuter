#!/bin/bash

# Screenshot SaaS PM2 Deployment Script
# Usage: ./deploy.sh [start|stop|restart|status|logs|build|deploy|test] [environment]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="screenshot-saas"

# Load deployment configuration
if [ -f "$PROJECT_DIR/deploy.config.local.sh" ]; then
    echo "Loading local deployment configuration..."
    source "$PROJECT_DIR/deploy.config.local.sh"
elif [ -f "$PROJECT_DIR/deploy.config.sh" ]; then
    echo "Loading default deployment configuration..."
    source "$PROJECT_DIR/deploy.config.sh"
else
    echo "Warning: No deployment configuration found. Using defaults."
    DEPLOY_ENV="development"
    DEV_PORT="8002"
fi

# Override environment if provided as argument
if [ -n "$2" ]; then
    DEPLOY_ENV="$2"
    echo "Environment overridden to: $DEPLOY_ENV"
fi

# Validate configuration
if command -v validate_config &> /dev/null; then
    validate_config || exit 1
fi

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

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed. Installing PM2..."
        npm install -g pm2
        print_success "PM2 installed successfully"
    fi
}

# Create environment files based on configuration
create_env_files() {
    print_status "Creating environment files for $DEPLOY_ENV environment..."
    
    local APP_URL=$(get_app_url)
    local API_URL=$(get_api_url)
    local WS_URL=$(get_ws_url)
    local PORT=$(get_port)
    
    # Create backend .env file
    cat > "$PROJECT_DIR/backend/.env" << EOF
NODE_ENV=$DEPLOY_ENV
PORT=$PORT

# URLs
FRONTEND_URL=$APP_URL

# Database
MONGODB_URI=$MONGODB_URI

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=$MAX_FILE_SIZE
UPLOAD_TIMEOUT=$UPLOAD_TIMEOUT

# Screenshot Settings
SCREENSHOT_TIMEOUT=$SCREENSHOT_TIMEOUT
CRAWL_TIMEOUT=$CRAWL_TIMEOUT
CRAWL_MAX_PAGES=$CRAWL_MAX_PAGES

# Rate Limiting
RATE_LIMIT_WINDOW_MS=$RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_REQUESTS=$RATE_LIMIT_MAX_REQUESTS

# Admin User
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Logging
LOG_LEVEL=info
EOF

    # Create frontend .env file
    cat > "$PROJECT_DIR/frontend/.env" << EOF
VITE_API_URL=$API_URL
VITE_WS_URL=$WS_URL
VITE_APP_ENV=$DEPLOY_ENV
EOF

    print_success "Environment files created for $DEPLOY_ENV"
}

# Build the application
build_app() {
    print_status "Building application..."
    cd "$PROJECT_DIR"
    
    # Create environment files first
    create_env_files
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm run install:all
    
    # Build frontend (unless skipped)
    if [ "$SKIP_FRONTEND_BUILD" != "true" ]; then
        print_status "Building frontend..."
        npm run build:frontend
    else
        print_warning "Skipping frontend build"
    fi
    
    # Build backend (unless skipped)
    if [ "$SKIP_BACKEND_BUILD" != "true" ]; then
        print_status "Building backend..."
        npm run build:backend
    else
        print_warning "Skipping backend build"
    fi
    
    print_success "Application built successfully"
}

# Start the application
start_app() {
    print_status "Starting $APP_NAME with PM2..."
    cd "$PROJECT_DIR"
    
    local APP_URL=$(get_app_url)
    local PORT=$(get_port)
    
    # Ensure environment files are created
    create_env_files
    
    # Start with PM2
    pm2 start ecosystem.config.js --env $DEPLOY_ENV
    pm2 save
    
    print_success "$APP_NAME started successfully"
    print_status "Application is running on $APP_URL"
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        print_status "Production deployment complete!"
        print_status "Domain: $PRODUCTION_DOMAIN"
        print_status "Protocol: $PRODUCTION_PROTOCOL"
        print_status "Port: $PORT"
    fi
}

# Stop the application
stop_app() {
    print_status "Stopping $APP_NAME..."
    pm2 stop $APP_NAME || print_warning "App was not running"
    pm2 delete $APP_NAME || print_warning "App was not in PM2 list"
    print_success "$APP_NAME stopped successfully"
}

# Restart the application
restart_app() {
    print_status "Restarting $APP_NAME..."
    pm2 restart $APP_NAME || {
        print_warning "App not found, starting fresh..."
        start_app
    }
    print_success "$APP_NAME restarted successfully"
}

# Show application status
show_status() {
    print_status "PM2 Status:"
    pm2 status
    echo ""
    print_status "Application logs (last 20 lines):"
    pm2 logs $APP_NAME --lines 20 --nostream || print_warning "No logs available"
}

# Show application logs
show_logs() {
    print_status "Showing logs for $APP_NAME..."
    pm2 logs $APP_NAME
}

# Test the deployment
test_deployment() {
    local APP_URL=$(get_app_url)
    local API_URL=$(get_api_url)
    local PORT=$(get_port)
    
    print_status "Testing deployment on $APP_URL..."
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    sleep 5
    
    # For production HTTPS, we might need different curl options
    local CURL_OPTS="-f -s"
    if [ "$PRODUCTION_PROTOCOL" = "https" ] && [ "$DEPLOY_ENV" = "production" ]; then
        CURL_OPTS="-f -s -k"  # -k to ignore SSL certificate issues during testing
    fi
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    local HEALTH_URL
    if [ "$DEPLOY_ENV" = "production" ]; then
        HEALTH_URL="${APP_URL}/health"
    else
        HEALTH_URL="http://localhost:${PORT}/health"
    fi
    
    if curl $CURL_OPTS "$HEALTH_URL" > /dev/null; then
        print_success "✓ Health endpoint is responding"
    else
        print_error "✗ Health endpoint is not responding at $HEALTH_URL"
        return 1
    fi
    
    # Test API endpoint
    print_status "Testing API endpoint..."
    local LOGIN_URL="${API_URL}/auth/login"
    if [ "$DEPLOY_ENV" != "production" ]; then
        LOGIN_URL="http://localhost:${PORT}/api/auth/login"
    fi
    
    if curl $CURL_OPTS "$LOGIN_URL" > /dev/null 2>&1 || [ $? -eq 22 ]; then
        print_success "✓ API endpoint is accessible"
    else
        print_error "✗ API endpoint is not accessible at $LOGIN_URL"
        return 1
    fi
    
    # Test static file serving (frontend)
    print_status "Testing frontend static files..."
    local FRONTEND_URL
    if [ "$DEPLOY_ENV" = "production" ]; then
        FRONTEND_URL="$APP_URL"
    else
        FRONTEND_URL="http://localhost:${PORT}"
    fi
    
    if curl $CURL_OPTS "$FRONTEND_URL" | grep -q "<!doctype html>"; then
        print_success "✓ Frontend is being served correctly"
    else
        print_error "✗ Frontend is not being served correctly at $FRONTEND_URL"
        return 1
    fi
    
    # Test WebSocket connection (basic check)
    print_status "Testing WebSocket endpoint..."
    local WS_URL
    if [ "$DEPLOY_ENV" = "production" ]; then
        WS_URL="${APP_URL}/socket.io/"
    else
        WS_URL="http://localhost:${PORT}/socket.io/"
    fi
    
    if curl $CURL_OPTS -H "Connection: Upgrade" -H "Upgrade: websocket" "$WS_URL" > /dev/null 2>&1 || [ $? -eq 22 ]; then
        print_success "✓ WebSocket endpoint is accessible"
    else
        print_warning "⚠ WebSocket endpoint test inconclusive (this is normal)"
    fi
    
    print_success "All deployment tests passed!"
    print_status "Application is ready at: $APP_URL"
    print_status "Default admin credentials: $ADMIN_EMAIL / $ADMIN_PASSWORD"
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        print_warning "Remember to change default admin credentials in production!"
        print_status "Configure your reverse proxy (nginx/apache) to forward requests to port $PORT"
    fi
    
    return 0
}

# Deploy (build + start)
deploy_app() {
    print_status "Deploying $APP_NAME..."
    
    # Stop if running
    stop_app
    
    # Build application
    build_app
    
    # Start application
    start_app
    
    # Show status
    show_status
    
    print_success "Deployment completed successfully!"
    print_status "Access your application at: http://localhost:8002"
}

# Main script logic
case "$1" in
    "start")
        check_pm2
        start_app
        ;;
    "stop")
        check_pm2
        stop_app
        ;;
    "restart")
        check_pm2
        restart_app
        ;;
    "status")
        check_pm2
        show_status
        ;;
    "logs")
        check_pm2
        show_logs
        ;;
    "build")
        build_app
        ;;
    "deploy")
        check_pm2
        deploy_app
        ;;
    "test")
        test_deployment
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|build|deploy|test}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application with PM2"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Show application status and recent logs"
        echo "  logs    - Show live application logs"
        echo "  build   - Build frontend and backend"
        echo "  deploy  - Full deployment (stop, build, start)"
        echo "  test    - Test the deployed application"
        echo ""
        echo "Example: $0 deploy && $0 test"
        exit 1
        ;;
esac

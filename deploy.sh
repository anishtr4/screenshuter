#!/bin/bash

# Screenshot SaaS PM2 Deployment Script
# Usage: ./deploy.sh [start|stop|restart|status|logs]

set -e

PROJECT_DIR="/Users/anishtr/CascadeProjects/screenshot-saas"
APP_NAME="screenshot-saas"

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

# Build the application
build_app() {
    print_status "Building application..."
    cd "$PROJECT_DIR"
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm run install:all
    
    # Build frontend
    print_status "Building frontend..."
    npm run build:frontend
    
    # Build backend
    print_status "Building backend..."
    npm run build:backend
    
    print_success "Application built successfully"
}

# Start the application
start_app() {
    print_status "Starting $APP_NAME with PM2..."
    cd "$PROJECT_DIR"
    
    # Copy production environment
    if [ -f ".env.production" ]; then
        cp .env.production backend/.env
        print_status "Production environment variables copied"
    fi
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    print_success "$APP_NAME started successfully"
    print_status "Application is running on http://localhost:3000"
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
    print_status "Access your application at: http://localhost:3000"
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
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|build|deploy}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application with PM2"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Show application status and recent logs"
        echo "  logs    - Show live application logs"
        echo "  build   - Build frontend and backend"
        echo "  deploy  - Full deployment (stop, build, start)"
        echo ""
        echo "Example: $0 deploy"
        exit 1
        ;;
esac

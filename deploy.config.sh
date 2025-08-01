#!/bin/bash

# Screenshot SaaS Deployment Configuration
# Copy this file to deploy.config.local.sh and customize for your environment

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

# Environment: development, staging, production
DEPLOY_ENV="${DEPLOY_ENV:-production}"

# =============================================================================
# DOMAIN AND URL CONFIGURATION
# =============================================================================

# Production domain (without protocol)
PRODUCTION_DOMAIN="${PRODUCTION_DOMAIN:-screenshot.amazon.in}"

# Protocol (http or https)
PRODUCTION_PROTOCOL="${PRODUCTION_PROTOCOL:-https}"

# Port configuration
PRODUCTION_PORT="${PRODUCTION_PORT:-8002}"

# Full production URL (auto-generated)
PRODUCTION_URL="${PRODUCTION_PROTOCOL}://${PRODUCTION_DOMAIN}"

# Development URLs (for local testing)
DEV_DOMAIN="${DEV_DOMAIN:-localhost}"
DEV_PROTOCOL="${DEV_PROTOCOL:-http}"
DEV_PORT="${DEV_PORT:-8002}"
DEV_URL="${DEV_PROTOCOL}://${DEV_DOMAIN}:${DEV_PORT}"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# MongoDB Configuration
MONGODB_HOST="${MONGODB_HOST:-localhost}"
MONGODB_PORT="${MONGODB_PORT:-27017}"
MONGODB_DATABASE="${MONGODB_DATABASE:-screenshot_saas}"
MONGODB_URI="${MONGODB_URI:-mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}}"

# =============================================================================
# SSL/TLS CONFIGURATION
# =============================================================================

# SSL Certificate paths (for production HTTPS)
SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/ssl/certs/screenshot-saas.crt}"
SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/ssl/private/screenshot-saas.key}"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET="${JWT_SECRET:-your-super-secret-jwt-key-change-in-production-$(date +%s)}"

# Admin User Configuration
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@screenshot-saas.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

# File Upload Settings
MAX_FILE_SIZE="${MAX_FILE_SIZE:-50mb}"
UPLOAD_TIMEOUT="${UPLOAD_TIMEOUT:-300000}"

# Screenshot Settings
SCREENSHOT_TIMEOUT="${SCREENSHOT_TIMEOUT:-30000}"
CRAWL_TIMEOUT="${CRAWL_TIMEOUT:-30000}"
CRAWL_MAX_PAGES="${CRAWL_MAX_PAGES:-50}"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="${RATE_LIMIT_WINDOW_MS:-900000}"
RATE_LIMIT_MAX_REQUESTS="${RATE_LIMIT_MAX_REQUESTS:-10000}"

# =============================================================================
# DEPLOYMENT SETTINGS
# =============================================================================

# PM2 Configuration
PM2_INSTANCES="${PM2_INSTANCES:-1}"
PM2_MAX_MEMORY="${PM2_MAX_MEMORY:-1G}"

# Build Settings
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-false}"
SKIP_BACKEND_BUILD="${SKIP_BACKEND_BUILD:-false}"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Get the appropriate URL based on environment
get_app_url() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        echo "$PRODUCTION_URL"
    else
        echo "$DEV_URL"
    fi
}

# Get the appropriate API URL based on environment
get_api_url() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        echo "${PRODUCTION_URL}/api"
    else
        echo "${DEV_URL}/api"
    fi
}

# Get the appropriate WebSocket URL based on environment
get_ws_url() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        echo "$PRODUCTION_URL"
    else
        echo "$DEV_URL"
    fi
}

# Get the port to use
get_port() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        echo "$PRODUCTION_PORT"
    else
        echo "$DEV_PORT"
    fi
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

validate_config() {
    local errors=0
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        if [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-in-production" ]; then
            echo "ERROR: Please change JWT_SECRET for production deployment!"
            errors=$((errors + 1))
        fi
        
        if [ "$ADMIN_PASSWORD" = "admin123" ]; then
            echo "WARNING: Please change ADMIN_PASSWORD for production deployment!"
        fi
        
        if [ "$PRODUCTION_PROTOCOL" = "https" ] && [ ! -f "$SSL_CERT_PATH" ]; then
            echo "WARNING: SSL certificate not found at $SSL_CERT_PATH"
        fi
    fi
    
    return $errors
}

# =============================================================================
# EXPORT CONFIGURATION
# =============================================================================

export DEPLOY_ENV PRODUCTION_DOMAIN PRODUCTION_PROTOCOL PRODUCTION_PORT PRODUCTION_URL
export DEV_DOMAIN DEV_PROTOCOL DEV_PORT DEV_URL
export MONGODB_HOST MONGODB_PORT MONGODB_DATABASE MONGODB_URI
export SSL_CERT_PATH SSL_KEY_PATH
export JWT_SECRET ADMIN_EMAIL ADMIN_PASSWORD
export MAX_FILE_SIZE UPLOAD_TIMEOUT SCREENSHOT_TIMEOUT CRAWL_TIMEOUT CRAWL_MAX_PAGES
export RATE_LIMIT_WINDOW_MS RATE_LIMIT_MAX_REQUESTS
export PM2_INSTANCES PM2_MAX_MEMORY
export SKIP_FRONTEND_BUILD SKIP_BACKEND_BUILD

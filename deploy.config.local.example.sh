#!/bin/bash

# Production Configuration Example for Screenshot SaaS
# Copy this file to deploy.config.local.sh and customize for your production environment

# =============================================================================
# PRODUCTION DEPLOYMENT CONFIGURATION
# =============================================================================

# Environment
export DEPLOY_ENV="production"

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================

# Your production domain (without protocol)
export PRODUCTION_DOMAIN="screenshot.amazon.in"

# Protocol (https recommended for production)
export PRODUCTION_PROTOCOL="https"

# Port (8002 is default, but you might use 80/443 with reverse proxy)
export PRODUCTION_PORT="8002"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Production MongoDB (consider using MongoDB Atlas or dedicated server)
export MONGODB_HOST="your-mongodb-server.com"
export MONGODB_PORT="27017"
export MONGODB_DATABASE="screenshot_saas_prod"
export MONGODB_URI="mongodb://username:password@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}"

# =============================================================================
# SECURITY CONFIGURATION (IMPORTANT!)
# =============================================================================

# Generate a strong JWT secret (NEVER use default in production!)
export JWT_SECRET="$(openssl rand -base64 64)"

# Production admin credentials (CHANGE THESE!)
export ADMIN_EMAIL="admin@screenshot.amazon.in"
export ADMIN_PASSWORD="$(openssl rand -base64 32)"

# =============================================================================
# SSL/TLS CONFIGURATION
# =============================================================================

# SSL Certificate paths (if serving HTTPS directly)
export SSL_CERT_PATH="/etc/ssl/certs/screenshot.amazon.in.crt"
export SSL_KEY_PATH="/etc/ssl/private/screenshot.amazon.in.key"

# =============================================================================
# PERFORMANCE CONFIGURATION
# =============================================================================

# PM2 Configuration for production
export PM2_INSTANCES="2"  # Number of instances (consider CPU cores)
export PM2_MAX_MEMORY="2G"  # Memory limit per instance

# File Upload Settings
export MAX_FILE_SIZE="100mb"  # Increase for production
export UPLOAD_TIMEOUT="600000"  # 10 minutes

# Screenshot Settings
export SCREENSHOT_TIMEOUT="60000"  # 1 minute
export CRAWL_TIMEOUT="120000"  # 2 minutes
export CRAWL_MAX_PAGES="100"

# Rate Limiting (adjust based on expected traffic)
export RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
export RATE_LIMIT_MAX_REQUESTS="50000"  # Requests per window

# =============================================================================
# BUILD CONFIGURATION
# =============================================================================

# Set to true to skip builds if already built
export SKIP_FRONTEND_BUILD="false"
export SKIP_BACKEND_BUILD="false"

# =============================================================================
# VALIDATION
# =============================================================================

validate_production_config() {
    local errors=0
    
    # Check required variables
    if [ -z "$PRODUCTION_DOMAIN" ]; then
        echo "ERROR: PRODUCTION_DOMAIN is required"
        errors=$((errors + 1))
    fi
    
    if [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-in-production" ]; then
        echo "ERROR: JWT_SECRET must be changed for production"
        errors=$((errors + 1))
    fi
    
    if [ "$ADMIN_PASSWORD" = "admin123" ]; then
        echo "ERROR: ADMIN_PASSWORD must be changed for production"
        errors=$((errors + 1))
    fi
    
    # Check SSL certificates if HTTPS
    if [ "$PRODUCTION_PROTOCOL" = "https" ]; then
        if [ ! -f "$SSL_CERT_PATH" ]; then
            echo "WARNING: SSL certificate not found at $SSL_CERT_PATH"
        fi
        if [ ! -f "$SSL_KEY_PATH" ]; then
            echo "WARNING: SSL private key not found at $SSL_KEY_PATH"
        fi
    fi
    
    return $errors
}

# Override the default validation function
validate_config() {
    validate_production_config
}

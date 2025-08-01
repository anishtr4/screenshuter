# Default Deployment Configuration for Windows
# Screenshot SaaS Application

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

# Default environment (can be overridden)
$global:DEPLOY_ENV = "development"

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================

# Production domain settings
$global:PRODUCTION_DOMAIN = "localhost"
$global:PRODUCTION_PROTOCOL = "http"
$global:PRODUCTION_PORT = "8002"

# Development settings
$global:DEVELOPMENT_PORT = "8002"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# MongoDB connection settings
$global:MONGODB_HOST = "localhost"
$global:MONGODB_PORT = "27017"
$global:MONGODB_DATABASE = "screenshot_saas"
$global:MONGODB_URI = "mongodb://$($global:MONGODB_HOST):$($global:MONGODB_PORT)/$($global:MONGODB_DATABASE)"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT Secret (CHANGE IN PRODUCTION!)
$global:JWT_SECRET = "your-super-secret-jwt-key-change-in-production"

# Default admin credentials (CHANGE IN PRODUCTION!)
$global:ADMIN_EMAIL = "admin@screenshot-saas.com"
$global:ADMIN_PASSWORD = "admin123"

# =============================================================================
# SSL/TLS CONFIGURATION
# =============================================================================

# SSL Certificate paths (Windows format)
$global:SSL_CERT_PATH = "C:\ssl\screenshot-saas.crt"
$global:SSL_KEY_PATH = "C:\ssl\screenshot-saas.key"

# =============================================================================
# PERFORMANCE CONFIGURATION
# =============================================================================

# PM2 Configuration
$global:PM2_INSTANCES = "1"
$global:PM2_MAX_MEMORY = "1G"

# File Upload Settings
$global:MAX_FILE_SIZE = "50mb"
$global:UPLOAD_TIMEOUT = "300000"

# Screenshot Settings
$global:SCREENSHOT_TIMEOUT = "30000"
$global:CRAWL_TIMEOUT = "60000"
$global:CRAWL_MAX_PAGES = "50"

# Rate Limiting
$global:RATE_LIMIT_WINDOW_MS = "900000"
$global:RATE_LIMIT_MAX_REQUESTS = "1000"

# =============================================================================
# BUILD CONFIGURATION
# =============================================================================

# Build options
$global:SKIP_FRONTEND_BUILD = "false"
$global:SKIP_BACKEND_BUILD = "false"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

function Get-Port {
    if ($global:DEPLOY_ENV -eq "production") {
        return $global:PRODUCTION_PORT
    } else {
        return $global:DEVELOPMENT_PORT
    }
}

function Get-AppUrl {
    $port = Get-Port
    if ($global:DEPLOY_ENV -eq "production") {
        if ($global:PRODUCTION_PORT -eq "80" -or $global:PRODUCTION_PORT -eq "443") {
            return "$($global:PRODUCTION_PROTOCOL)://$($global:PRODUCTION_DOMAIN)"
        } else {
            return "$($global:PRODUCTION_PROTOCOL)://$($global:PRODUCTION_DOMAIN):$port"
        }
    } else {
        return "http://localhost:$port"
    }
}

function Get-ApiUrl {
    $appUrl = Get-AppUrl
    return "$appUrl/api"
}

# =============================================================================
# VALIDATION
# =============================================================================

function Test-Configuration {
    $errors = 0
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
        $errors++
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "npm version: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
        $errors++
    }
    
    # Check PM2
    try {
        $pm2Version = pm2 --version
        Write-Host "PM2 version: $pm2Version" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: PM2 is not installed. Install with: npm install -g pm2" -ForegroundColor Yellow
    }
    
    return $errors -eq 0
}

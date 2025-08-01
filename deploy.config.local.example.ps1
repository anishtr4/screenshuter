# Production Configuration Example for Screenshot SaaS (Windows)
# Copy this file to deploy.config.local.ps1 and customize for your production environment

# =============================================================================
# PRODUCTION DEPLOYMENT CONFIGURATION
# =============================================================================

# Environment
$global:DEPLOY_ENV = "production"

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================

# Your production domain (without protocol)
$global:PRODUCTION_DOMAIN = "screenshot.amazon.in"

# Protocol (https recommended for production)
$global:PRODUCTION_PROTOCOL = "https"

# Port (8002 is default, but you might use 80/443 with reverse proxy)
$global:PRODUCTION_PORT = "8002"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Production MongoDB (consider using MongoDB Atlas or dedicated server)
$global:MONGODB_HOST = "your-mongodb-server.com"
$global:MONGODB_PORT = "27017"
$global:MONGODB_DATABASE = "screenshot_saas_prod"
$global:MONGODB_URI = "mongodb://username:password@$($global:MONGODB_HOST):$($global:MONGODB_PORT)/$($global:MONGODB_DATABASE)"

# =============================================================================
# SECURITY CONFIGURATION (IMPORTANT!)
# =============================================================================

# Generate a strong JWT secret (NEVER use default in production!)
# You can generate one using: [System.Web.Security.Membership]::GeneratePassword(64, 0)
$global:JWT_SECRET = "your-generated-jwt-secret-here"

# Production admin credentials (CHANGE THESE!)
$global:ADMIN_EMAIL = "admin@screenshot.amazon.in"
$global:ADMIN_PASSWORD = "your-secure-admin-password"

# =============================================================================
# SSL/TLS CONFIGURATION
# =============================================================================

# SSL Certificate paths (Windows format)
$global:SSL_CERT_PATH = "C:\ssl\certs\screenshot.amazon.in.crt"
$global:SSL_KEY_PATH = "C:\ssl\private\screenshot.amazon.in.key"

# =============================================================================
# PERFORMANCE CONFIGURATION
# =============================================================================

# PM2 Configuration for production
$global:PM2_INSTANCES = "2"  # Number of instances (consider CPU cores)
$global:PM2_MAX_MEMORY = "2G"  # Memory limit per instance

# File Upload Settings
$global:MAX_FILE_SIZE = "100mb"  # Increase for production
$global:UPLOAD_TIMEOUT = "600000"  # 10 minutes

# Screenshot Settings
$global:SCREENSHOT_TIMEOUT = "60000"  # 1 minute
$global:CRAWL_TIMEOUT = "120000"  # 2 minutes
$global:CRAWL_MAX_PAGES = "100"

# Rate Limiting (adjust based on expected traffic)
$global:RATE_LIMIT_WINDOW_MS = "900000"  # 15 minutes
$global:RATE_LIMIT_MAX_REQUESTS = "50000"  # Requests per window

# =============================================================================
# BUILD CONFIGURATION
# =============================================================================

# Set to true to skip builds if already built
$global:SKIP_FRONTEND_BUILD = "false"
$global:SKIP_BACKEND_BUILD = "false"

# =============================================================================
# WINDOWS-SPECIFIC CONFIGURATION
# =============================================================================

# IIS Configuration (if using IIS as reverse proxy)
$global:IIS_SITE_NAME = "Screenshot-SaaS"
$global:IIS_APP_POOL = "Screenshot-SaaS-Pool"

# Windows Service Configuration (optional)
$global:WINDOWS_SERVICE_NAME = "Screenshot-SaaS"
$global:WINDOWS_SERVICE_DISPLAY_NAME = "Screenshot SaaS Application"

# =============================================================================
# VALIDATION
# =============================================================================

function Test-ProductionConfig {
    $errors = 0
    
    # Check required variables
    if (-not $global:PRODUCTION_DOMAIN -or $global:PRODUCTION_DOMAIN -eq "localhost") {
        Write-Host "ERROR: PRODUCTION_DOMAIN is required for production" -ForegroundColor Red
        $errors++
    }
    
    if ($global:JWT_SECRET -eq "your-super-secret-jwt-key-change-in-production") {
        Write-Host "ERROR: JWT_SECRET must be changed for production" -ForegroundColor Red
        $errors++
    }
    
    if ($global:ADMIN_PASSWORD -eq "admin123") {
        Write-Host "ERROR: ADMIN_PASSWORD must be changed for production" -ForegroundColor Red
        $errors++
    }
    
    # Check SSL certificates if HTTPS
    if ($global:PRODUCTION_PROTOCOL -eq "https") {
        if (-not (Test-Path $global:SSL_CERT_PATH)) {
            Write-Host "WARNING: SSL certificate not found at $($global:SSL_CERT_PATH)" -ForegroundColor Yellow
        }
        if (-not (Test-Path $global:SSL_KEY_PATH)) {
            Write-Host "WARNING: SSL private key not found at $($global:SSL_KEY_PATH)" -ForegroundColor Yellow
        }
    }
    
    # Check MongoDB connection
    try {
        # This is a basic check - you might want to implement actual MongoDB connectivity test
        if ($global:MONGODB_URI -match "mongodb://.*") {
            Write-Host "MongoDB URI format appears valid" -ForegroundColor Green
        }
    } catch {
        Write-Host "WARNING: Could not validate MongoDB connection" -ForegroundColor Yellow
    }
    
    return $errors -eq 0
}

# Override the default validation function
function Test-Configuration {
    return Test-ProductionConfig
}

# =============================================================================
# WINDOWS-SPECIFIC HELPER FUNCTIONS
# =============================================================================

function Install-Prerequisites {
    Write-Host "Installing prerequisites for Windows..." -ForegroundColor Cyan
    
    # Check if Chocolatey is installed
    try {
        choco --version | Out-Null
        Write-Host "Chocolatey is installed" -ForegroundColor Green
    } catch {
        Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Install Node.js if not present
    try {
        node --version | Out-Null
        Write-Host "Node.js is installed" -ForegroundColor Green
    } catch {
        Write-Host "Installing Node.js..." -ForegroundColor Yellow
        choco install nodejs -y
    }
    
    # Install PM2 globally
    try {
        pm2 --version | Out-Null
        Write-Host "PM2 is installed" -ForegroundColor Green
    } catch {
        Write-Host "Installing PM2..." -ForegroundColor Yellow
        npm install -g pm2
        pm2 install pm2-windows-startup
        pm2-startup install
    }
}

function Set-WindowsFirewall {
    Write-Host "Configuring Windows Firewall..." -ForegroundColor Cyan
    
    $port = Get-Port
    
    # Allow inbound traffic on the application port
    try {
        New-NetFirewallRule -DisplayName "Screenshot SaaS" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow
        Write-Host "Firewall rule created for port $port" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Could not create firewall rule. You may need to configure manually." -ForegroundColor Yellow
    }
}

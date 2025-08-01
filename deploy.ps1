# Screenshot SaaS Deployment Script for Windows Server
# PowerShell version of deploy.sh

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Environment = "development"
)

# =============================================================================
# CONFIGURATION
# =============================================================================

$APP_NAME = "Screenshot SaaS"
$PROJECT_DIR = $PSScriptRoot
$DEPLOY_ENV = $Environment

# Colors for output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Cyan"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $BLUE
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $GREEN
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $RED
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $YELLOW
}

# =============================================================================
# CONFIGURATION LOADING
# =============================================================================

function Load-Configuration {
    Write-Status "Loading deployment configuration..."
    
    # Load default configuration
    $defaultConfigPath = Join-Path $PROJECT_DIR "deploy.config.ps1"
    if (Test-Path $defaultConfigPath) {
        Write-Status "Loading default configuration from deploy.config.ps1"
        . $defaultConfigPath
    }
    
    # Load local configuration (overrides)
    $localConfigPath = Join-Path $PROJECT_DIR "deploy.config.local.ps1"
    if (Test-Path $localConfigPath) {
        Write-Status "Loading local configuration from deploy.config.local.ps1"
        . $localConfigPath
    }
    
    # Environment override
    if ($Environment -ne "development") {
        $global:DEPLOY_ENV = $Environment
        Write-Status "Environment overridden to: $Environment"
    }
    
    # Set defaults if not configured
    if (-not $global:PRODUCTION_DOMAIN) { $global:PRODUCTION_DOMAIN = "localhost" }
    if (-not $global:PRODUCTION_PROTOCOL) { $global:PRODUCTION_PROTOCOL = "http" }
    if (-not $global:PRODUCTION_PORT) { $global:PRODUCTION_PORT = "8002" }
    if (-not $global:DEVELOPMENT_PORT) { $global:DEVELOPMENT_PORT = "8002" }
    if (-not $global:MONGODB_URI) { $global:MONGODB_URI = "mongodb://localhost:27017/screenshot_saas" }
    if (-not $global:JWT_SECRET) { $global:JWT_SECRET = "your-super-secret-jwt-key-change-in-production" }
    if (-not $global:ADMIN_EMAIL) { $global:ADMIN_EMAIL = "admin@screenshot-saas.com" }
    if (-not $global:ADMIN_PASSWORD) { $global:ADMIN_PASSWORD = "admin123" }
}

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
# ENVIRONMENT FILE CREATION
# =============================================================================

function Create-EnvFiles {
    Write-Status "Creating environment files..."
    
    $port = Get-Port
    $appUrl = Get-AppUrl
    $apiUrl = Get-ApiUrl
    
    # Create backend .env file
    $backendEnvPath = Join-Path $PROJECT_DIR "backend\.env"
    $backendEnv = @"
NODE_ENV=$($global:DEPLOY_ENV)
PORT=$port
MONGODB_URI=$($global:MONGODB_URI)
JWT_SECRET=$($global:JWT_SECRET)
ADMIN_EMAIL=$($global:ADMIN_EMAIL)
ADMIN_PASSWORD=$($global:ADMIN_PASSWORD)
CORS_ORIGIN=$appUrl
MAX_FILE_SIZE=50mb
UPLOAD_TIMEOUT=300000
SCREENSHOT_TIMEOUT=30000
CRAWL_TIMEOUT=60000
CRAWL_MAX_PAGES=50
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
"@
    
    Set-Content -Path $backendEnvPath -Value $backendEnv -Encoding UTF8
    Write-Status "Backend .env file created"
    
    # Create frontend .env file
    $frontendEnvPath = Join-Path $PROJECT_DIR "frontend\.env"
    $frontendEnv = @"
VITE_API_URL=$apiUrl
VITE_WS_URL=$appUrl
VITE_APP_NAME=Screenshot SaaS
VITE_MAX_FILE_SIZE=50
"@
    
    Set-Content -Path $frontendEnvPath -Value $frontendEnv -Encoding UTF8
    Write-Status "Frontend .env file created"
    
    Write-Success "Environment files created successfully"
}

# =============================================================================
# BUILD FUNCTIONS
# =============================================================================

function Build-Frontend {
    if ($global:SKIP_FRONTEND_BUILD -eq "true") {
        Write-Status "Skipping frontend build (SKIP_FRONTEND_BUILD=true)"
        return
    }
    
    Write-Status "Building frontend..."
    Set-Location (Join-Path $PROJECT_DIR "frontend")
    
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing frontend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Frontend dependency installation failed"
            exit 1
        }
    }
    
    Write-Status "Building frontend for production..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    Set-Location $PROJECT_DIR
    Write-Success "Frontend built successfully"
}

function Build-Backend {
    if ($global:SKIP_BACKEND_BUILD -eq "true") {
        Write-Status "Skipping backend build (SKIP_BACKEND_BUILD=true)"
        return
    }
    
    Write-Status "Building backend..."
    Set-Location (Join-Path $PROJECT_DIR "backend")
    
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing backend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Backend dependency installation failed"
            exit 1
        }
    }
    
    Write-Status "Building backend..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend build failed"
        exit 1
    }
    
    Set-Location $PROJECT_DIR
    Write-Success "Backend built successfully"
}

function Build-App {
    Write-Status "Building $APP_NAME..."
    
    # Create logs directory
    $logsDir = Join-Path $PROJECT_DIR "logs"
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }
    
    # Create uploads directory
    $uploadsDir = Join-Path $PROJECT_DIR "uploads"
    if (-not (Test-Path $uploadsDir)) {
        New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
    }
    
    Build-Backend
    Build-Frontend
    
    Write-Success "$APP_NAME built successfully"
}

# =============================================================================
# PM2 FUNCTIONS
# =============================================================================

function Start-App {
    Write-Status "Starting $APP_NAME with PM2..."
    Set-Location $PROJECT_DIR
    
    $appUrl = Get-AppUrl
    $port = Get-Port
    
    # Ensure environment files are created
    Create-EnvFiles
    
    # Start with PM2
    pm2 start ecosystem.config.js --env $global:DEPLOY_ENV
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start application with PM2"
        exit 1
    }
    
    pm2 save
    
    Write-Success "$APP_NAME started successfully"
    Write-Status "Application is running on $appUrl"
    
    if ($global:DEPLOY_ENV -eq "production") {
        Write-Status "Production deployment complete!"
        Write-Status "Domain: $($global:PRODUCTION_DOMAIN)"
        Write-Status "Protocol: $($global:PRODUCTION_PROTOCOL)"
        Write-Status "Port: $port"
    }
}

function Stop-App {
    Write-Status "Stopping $APP_NAME..."
    pm2 stop screenshot-saas
    pm2 delete screenshot-saas
    Write-Success "$APP_NAME stopped"
}

function Restart-App {
    Write-Status "Restarting $APP_NAME..."
    Create-EnvFiles
    pm2 restart screenshot-saas
    Write-Success "$APP_NAME restarted"
}

function Get-Status {
    Write-Status "Checking $APP_NAME status..."
    pm2 status screenshot-saas
}

function Get-Logs {
    Write-Status "Showing $APP_NAME logs..."
    pm2 logs screenshot-saas --lines 50
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

function Deploy-App {
    Write-Status "Deploying $APP_NAME to $global:DEPLOY_ENV environment..."
    
    # Validate configuration
    if ($global:DEPLOY_ENV -eq "production") {
        if ($global:JWT_SECRET -eq "your-super-secret-jwt-key-change-in-production") {
            Write-Error "JWT_SECRET must be changed for production deployment"
            exit 1
        }
        if ($global:ADMIN_PASSWORD -eq "admin123") {
            Write-Warning "Default admin password detected. Consider changing for production."
        }
    }
    
    # Stop existing application
    try {
        pm2 stop screenshot-saas 2>$null
        pm2 delete screenshot-saas 2>$null
    } catch {
        # Ignore errors if app is not running
    }
    
    # Build and start
    Build-App
    Start-App
    
    Write-Success "Deployment completed successfully!"
    
    # Run tests
    Write-Status "Running deployment tests..."
    Test-Deployment
}

function Test-Deployment {
    $appUrl = Get-AppUrl
    $apiUrl = Get-ApiUrl
    $port = Get-Port
    
    Write-Status "Testing deployment on $appUrl..."
    
    # Wait for server to start
    Write-Status "Waiting for server to start..."
    Start-Sleep -Seconds 5
    
    $testsPassed = $true
    
    # Test health endpoint
    Write-Status "Testing health endpoint..."
    $healthUrl = if ($global:DEPLOY_ENV -eq "production") { "$appUrl/health" } else { "http://localhost:$port/health" }
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "✓ Health endpoint is responding"
        } else {
            Write-Error "✗ Health endpoint returned status $($response.StatusCode)"
            $testsPassed = $false
        }
    } catch {
        Write-Error "✗ Health endpoint is not responding at $healthUrl"
        $testsPassed = $false
    }
    
    # Test API endpoint
    Write-Status "Testing API endpoint..."
    $loginUrl = if ($global:DEPLOY_ENV -eq "production") { "$apiUrl/auth/login" } else { "http://localhost:$port/api/auth/login" }
    
    try {
        $response = Invoke-WebRequest -Uri $loginUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Success "✓ API endpoint is accessible"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 405 -or $_.Exception.Response.StatusCode -eq 400) {
            Write-Success "✓ API endpoint is accessible (expected error for GET request)"
        } else {
            Write-Error "✗ API endpoint is not accessible at $loginUrl"
            $testsPassed = $false
        }
    }
    
    # Test frontend static files
    Write-Status "Testing frontend static files..."
    $frontendUrl = if ($global:DEPLOY_ENV -eq "production") { $appUrl } else { "http://localhost:$port" }
    
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10 -UseBasicParsing
        if ($response.Content -match "<!doctype html>") {
            Write-Success "✓ Frontend is being served correctly"
        } else {
            Write-Error "✗ Frontend is not being served correctly"
            $testsPassed = $false
        }
    } catch {
        Write-Error "✗ Frontend is not being served correctly at $frontendUrl"
        $testsPassed = $false
    }
    
    if ($testsPassed) {
        Write-Success "All deployment tests passed!"
        Write-Status "Application is ready at: $appUrl"
        Write-Status "Default admin credentials: $($global:ADMIN_EMAIL) / $($global:ADMIN_PASSWORD)"
        
        if ($global:DEPLOY_ENV -eq "production") {
            Write-Warning "Remember to change default admin credentials in production!"
            Write-Status "Configure your reverse proxy (IIS/nginx) to forward requests to port $port"
        }
    } else {
        Write-Error "Some deployment tests failed!"
        exit 1
    }
}

# =============================================================================
# HELP FUNCTION
# =============================================================================

function Show-Help {
    Write-Host @"
Screenshot SaaS Deployment Script (Windows PowerShell Version)

Usage: .\deploy.ps1 <command> [environment]

Commands:
  build                 Build the application
  start [env]          Start the application
  stop                 Stop the application
  restart [env]        Restart the application
  status               Show application status
  logs                 Show application logs
  deploy [env]         Full deployment (build + start)
  test [env]           Test the deployment
  help                 Show this help message

Environments:
  development          Development environment (default)
  staging              Staging environment
  production           Production environment

Examples:
  .\deploy.ps1 deploy                    # Deploy to development
  .\deploy.ps1 deploy production         # Deploy to production
  .\deploy.ps1 test production           # Test production deployment
  .\deploy.ps1 start staging             # Start in staging mode
  .\deploy.ps1 logs                      # View logs

Configuration:
  - Copy deploy.config.local.example.ps1 to deploy.config.local.ps1
  - Edit deploy.config.local.ps1 with your settings
  - The script will automatically load your configuration

For production deployment with custom domain:
  1. Configure your domain in deploy.config.local.ps1
  2. Run: .\deploy.ps1 deploy production
  3. Configure IIS or nginx reverse proxy
"@
}

# =============================================================================
# MAIN SCRIPT LOGIC
# =============================================================================

# Load configuration
Load-Configuration

# Execute command
switch ($Command.ToLower()) {
    "build" { Build-App }
    "start" { Start-App }
    "stop" { Stop-App }
    "restart" { Restart-App }
    "status" { Get-Status }
    "logs" { Get-Logs }
    "deploy" { Deploy-App }
    "test" { Test-Deployment }
    "help" { Show-Help }
    default { 
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}

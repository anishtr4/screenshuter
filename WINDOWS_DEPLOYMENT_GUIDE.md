# Screenshot SaaS - Windows Server Deployment Guide

## Overview

This guide covers deploying the Screenshot SaaS application to Windows Server with a custom domain like `https://screenshot.amazon.in`.

## Prerequisites

- Windows Server 2016+ or Windows 10/11
- PowerShell 5.1 or PowerShell Core 7+
- Administrator privileges
- Internet connection for downloading dependencies

## Quick Start

### 1. Clone and Setup

```powershell
git clone <your-repo>
cd screenshot-saas
```

### 2. Install Prerequisites (Run as Administrator)

```powershell
# Set execution policy to allow scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install prerequisites
.\deploy.config.local.example.ps1
Install-Prerequisites
```

### 3. Configure for Production

```powershell
# Copy the production config template
Copy-Item deploy.config.local.example.ps1 deploy.config.local.ps1

# Edit the configuration
notepad deploy.config.local.ps1
```

### 4. Deploy

```powershell
# Deploy to production
.\deploy.ps1 deploy production

# Test the deployment
.\deploy.ps1 test production
```

## Detailed Setup

### Step 1: Install Node.js and Dependencies

#### Option A: Manual Installation
1. Download Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Install Node.js with npm
3. Install PM2 globally:
   ```powershell
   npm install -g pm2
   pm2 install pm2-windows-startup
   pm2-startup install
   ```

#### Option B: Using Chocolatey (Recommended)
```powershell
# Install Chocolatey (run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs -y

# Install PM2
npm install -g pm2
pm2 install pm2-windows-startup
pm2-startup install
```

### Step 2: Install MongoDB

#### Option A: Local MongoDB
```powershell
# Using Chocolatey
choco install mongodb -y

# Start MongoDB service
net start MongoDB
```

#### Option B: MongoDB Atlas (Recommended for Production)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in your config

### Step 3: Configure Production Settings

Edit `deploy.config.local.ps1`:

```powershell
# Environment
$global:DEPLOY_ENV = "production"

# Domain Configuration
$global:PRODUCTION_DOMAIN = "screenshot.amazon.in"
$global:PRODUCTION_PROTOCOL = "https"
$global:PRODUCTION_PORT = "8002"

# Database (MongoDB Atlas example)
$global:MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/screenshot_saas_prod"

# Security (IMPORTANT: Change these!)
$global:JWT_SECRET = "your-generated-jwt-secret-here"
$global:ADMIN_EMAIL = "admin@screenshot.amazon.in"
$global:ADMIN_PASSWORD = "your-secure-admin-password"

# SSL Certificate paths (Windows format)
$global:SSL_CERT_PATH = "C:\ssl\certs\screenshot.amazon.in.crt"
$global:SSL_KEY_PATH = "C:\ssl\private\screenshot.amazon.in.key"
```

### Step 4: Configure Windows Firewall

```powershell
# Allow inbound traffic on port 8002
New-NetFirewallRule -DisplayName "Screenshot SaaS" -Direction Inbound -Protocol TCP -LocalPort 8002 -Action Allow

# If using HTTPS directly, also allow 443
New-NetFirewallRule -DisplayName "Screenshot SaaS HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### Step 5: SSL Certificate Setup

#### Option A: Using Let's Encrypt with win-acme
```powershell
# Download win-acme from https://www.win-acme.com/
# Run as Administrator
.\wacs.exe

# Follow prompts to generate certificate for your domain
# Certificates will be stored in C:\ProgramData\win-acme\
```

#### Option B: Commercial SSL Certificate
1. Purchase SSL certificate from a CA
2. Install certificate in Windows Certificate Store
3. Export certificate and private key to files
4. Update paths in configuration

## IIS Reverse Proxy Setup (Recommended for Production)

### Install IIS and URL Rewrite Module

```powershell
# Enable IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent

# Install URL Rewrite Module
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
```

### Configure IIS Site

1. **Create new site in IIS Manager**:
   - Site name: `Screenshot-SaaS`
   - Physical path: `C:\inetpub\wwwroot\screenshot-saas`
   - Binding: `https` on port `443` with your SSL certificate

2. **Create web.config** in site root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:8002/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="104857600" />
            </requestFiltering>
        </security>
    </system.webServer>
</configuration>
```

## Deployment Commands

### Basic Commands

```powershell
# Deploy to production
.\deploy.ps1 deploy production

# Deploy to staging
.\deploy.ps1 deploy staging

# Deploy to development (default)
.\deploy.ps1 deploy

# Test deployment
.\deploy.ps1 test production

# View status
.\deploy.ps1 status

# View logs
.\deploy.ps1 logs

# Restart application
.\deploy.ps1 restart production

# Stop application
.\deploy.ps1 stop
```

### Environment-Specific Deployment

```powershell
# Development (localhost:8002)
.\deploy.ps1 deploy development

# Staging
$env:DEPLOY_ENV="staging"; $env:PRODUCTION_DOMAIN="staging.screenshot.amazon.in"; .\deploy.ps1 deploy staging

# Production
.\deploy.ps1 deploy production
```

## Windows Service Configuration (Optional)

To run as a Windows Service:

```powershell
# Install PM2 as Windows Service
pm2-startup install

# Save current PM2 processes
pm2 save

# The service will auto-start on boot
```

## Monitoring and Maintenance

### PM2 Monitoring on Windows

```powershell
# View PM2 dashboard
pm2 monit

# View logs
pm2 logs screenshot-saas

# Restart if needed
pm2 restart screenshot-saas

# View process list
pm2 list
```

### Windows Event Logs

```powershell
# View application events
Get-EventLog -LogName Application -Source "PM2" -Newest 50

# View system events
Get-EventLog -LogName System -Newest 50 | Where-Object {$_.Source -like "*Node*"}
```

### Performance Monitoring

```powershell
# Check CPU and memory usage
Get-Process -Name node

# Monitor port usage
netstat -an | findstr :8002
```

## Security Considerations

### 1. Windows Defender Firewall

```powershell
# Configure firewall rules
New-NetFirewallRule -DisplayName "Screenshot SaaS HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Screenshot SaaS HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Screenshot SaaS App" -Direction Inbound -Protocol TCP -LocalPort 8002 -Action Allow
```

### 2. User Account Control

```powershell
# Run PM2 with proper permissions
# Create dedicated service account for the application
New-LocalUser -Name "ScreenshotSaaS" -Password (ConvertTo-SecureString "SecurePassword123!" -AsPlainText -Force) -FullName "Screenshot SaaS Service Account"

# Grant necessary permissions
# Add to "Log on as a service" right in Local Security Policy
```

### 3. SSL/TLS Configuration

```powershell
# Disable weak SSL protocols in registry
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\SSL 2.0\Server" -Name "Enabled" -Value 0
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\SSL 3.0\Server" -Name "Enabled" -Value 0
```

## Troubleshooting

### Common Issues

1. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Port already in use**
   ```powershell
   # Find process using port
   netstat -ano | findstr :8002
   
   # Kill process
   taskkill /PID <PID> /F
   ```

3. **PM2 not starting on boot**
   ```powershell
   pm2-startup install
   pm2 save
   ```

4. **SSL certificate issues**
   ```powershell
   # Check certificate validity
   Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object {$_.Subject -like "*screenshot.amazon.in*"}
   ```

5. **MongoDB connection issues**
   ```powershell
   # Test MongoDB connection
   mongo $env:MONGODB_URI
   
   # Check MongoDB service
   Get-Service -Name MongoDB
   ```

### Debugging

```powershell
# Enable debug logging
$env:LOG_LEVEL="debug"

# Check PM2 status
pm2 status

# View detailed logs
pm2 logs screenshot-saas --lines 100

# Check Windows Event Logs
Get-EventLog -LogName Application -Source "Node.js" -Newest 10
```

## Backup and Recovery

### Database Backup

```powershell
# Create backup directory
New-Item -ItemType Directory -Path "C:\Backups\MongoDB" -Force

# Backup MongoDB (if local)
mongodump --uri="$env:MONGODB_URI" --out="C:\Backups\MongoDB\$(Get-Date -Format 'yyyyMMdd')"

# Restore backup
mongorestore --uri="$env:MONGODB_URI" "C:\Backups\MongoDB\20240101"
```

### Application Backup

```powershell
# Backup uploads and logs
Compress-Archive -Path "uploads", "logs" -DestinationPath "C:\Backups\App\backup-$(Get-Date -Format 'yyyyMMdd').zip"
```

## Performance Optimization

### Windows-Specific Optimizations

```powershell
# Increase file handle limits
# Edit registry or use PowerShell
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\SubSystems" -Name "Windows" -Value "..."

# Configure IIS for better performance
# Enable compression, caching, etc. in IIS Manager
```

### PM2 Clustering

```powershell
# Use multiple PM2 instances
$global:PM2_INSTANCES = "4"  # Based on CPU cores
.\deploy.ps1 restart production
```

## Support

For Windows-specific issues:
- Check Windows Event Logs
- Review IIS logs (if using IIS)
- Monitor PM2 processes: `pm2 monit`
- Test deployment: `.\deploy.ps1 test production`

---

*Last updated: January 2025*

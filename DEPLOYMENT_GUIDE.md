# Screenshot SaaS - Manual Production Deployment Guide

## Overview

This guide covers manually deploying the Screenshot SaaS application to production. The application consists of a React frontend and Node.js backend that can be deployed to any server or cloud platform.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended) or cloud platform
- Node.js 18+ and npm
- MongoDB (local, cloud instance, or MongoDB Atlas)
- PM2 process manager (for Node.js apps)
- Nginx (for reverse proxy and static file serving)
- SSL certificate (for HTTPS)
- Domain name configured

## Manual Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Clone and Setup Application

```bash
# Clone repository
git clone <your-repository-url>
cd screenshot-saas

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create environment files for both frontend and backend:

**Backend Environment (.env)**
```bash
cd backend
cat > .env << EOF
NODE_ENV=production
PORT=8003
MONGODB_URI=mongodb://localhost:27017/screenshot-saas-prod
JWT_SECRET=$(openssl rand -base64 64)
FRONTEND_URL=https://yourdomain.com
EOF
```

**Frontend Environment (.env)**
```bash
cd ../frontend
cat > .env << EOF
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=https://yourdomain.com
EOF
```

### 4. Build the Applications

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

### 5. Configure PM2 for Backend

Create PM2 ecosystem file:
```bash
cd ..
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'screenshot-saas-backend',
    script: './backend/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8003
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 6. Configure Nginx

Create Nginx configuration:
```bash
sudo cat > /etc/nginx/sites-available/screenshot-saas << EOF
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Serve frontend static files
    location / {
        root /path/to/screenshot-saas/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Proxy Socket.IO requests
    location /socket.io/ {
        proxy_pass http://localhost:8003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # File upload size
    client_max_body_size 100M;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/screenshot-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 8. Access Your Application

Your application will be available at:
- **URL**: `https://yourdomain.com`
- **API Base**: `https://yourdomain.com/api/`
- **Admin Login**: Create admin user via API or database

### Additional Commands

```bash
# View application status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart application
./deploy.sh restart production

# Stop application
./deploy.sh stop
```

## Detailed Configuration

### Environment Configuration

Create `deploy.config.local.sh` with your production settings:

```bash
#!/bin/bash

# Environment
export DEPLOY_ENV="production"

# Domain Configuration
export PRODUCTION_DOMAIN="screenshot.amazon.in"
export PRODUCTION_PROTOCOL="https"
export PRODUCTION_PORT="8002"

# Database (use your production MongoDB)
export MONGODB_URI="mongodb://username:password@your-mongodb-server.com:27017/screenshot_saas_prod"

# Security (IMPORTANT: Change these!)
export JWT_SECRET="$(openssl rand -base64 64)"
export ADMIN_EMAIL="admin@screenshot.amazon.in"
export ADMIN_PASSWORD="$(openssl rand -base64 32)"

# Performance
export PM2_INSTANCES="2"
export PM2_MAX_MEMORY="2G"
```

### SSL Certificate Setup

For HTTPS, you need SSL certificates:

```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d screenshot.amazon.in

# Update config with certificate paths
export SSL_CERT_PATH="/etc/letsencrypt/live/screenshot.amazon.in/fullchain.pem"
export SSL_KEY_PATH="/etc/letsencrypt/live/screenshot.amazon.in/privkey.pem"
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/screenshot-saas`:

```nginx
server {
    listen 80;
    server_name screenshot.amazon.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name screenshot.amazon.in;

    ssl_certificate /etc/letsencrypt/live/screenshot.amazon.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/screenshot.amazon.in/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:8002;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File upload size
    client_max_body_size 100M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/screenshot-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment Commands

### Basic Commands

```bash
# Deploy to production
./deploy.sh deploy production

# Deploy to staging
./deploy.sh deploy staging

# Deploy to development (default)
./deploy.sh deploy

# Test deployment
./deploy.sh test production

# View status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart application
./deploy.sh restart production

# Stop application
./deploy.sh stop
```

### Environment-Specific Deployment

```bash
# Development (localhost:8002)
./deploy.sh deploy development

# Staging (your staging domain)
DEPLOY_ENV=staging PRODUCTION_DOMAIN=staging.screenshot.amazon.in ./deploy.sh deploy staging

# Production (your production domain)
./deploy.sh deploy production
```

## Configuration Options

### Domain Configuration

```bash
# Basic domain setup
export PRODUCTION_DOMAIN="screenshot.amazon.in"
export PRODUCTION_PROTOCOL="https"
export PRODUCTION_PORT="8002"

# Subdomain setup
export PRODUCTION_DOMAIN="app.amazon.in"

# Custom port
export PRODUCTION_PORT="3000"
```

### Database Configuration

```bash
# Local MongoDB
export MONGODB_URI="mongodb://localhost:27017/screenshot_saas"

# Remote MongoDB
export MONGODB_URI="mongodb://username:password@db.example.com:27017/screenshot_saas"

# MongoDB Atlas
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/screenshot_saas"
```

### Performance Tuning

```bash
# Multiple PM2 instances
export PM2_INSTANCES="4"  # Based on CPU cores

# Memory limits
export PM2_MAX_MEMORY="4G"

# File upload limits
export MAX_FILE_SIZE="200mb"
export UPLOAD_TIMEOUT="900000"  # 15 minutes

# Rate limiting
export RATE_LIMIT_MAX_REQUESTS="100000"
```

## Security Considerations

### 1. Change Default Credentials

```bash
# Generate secure admin password
export ADMIN_PASSWORD="$(openssl rand -base64 32)"

# Use strong JWT secret
export JWT_SECRET="$(openssl rand -base64 64)"
```

### 2. Database Security

```bash
# Use authentication
export MONGODB_URI="mongodb://admin:secure_password@localhost:27017/screenshot_saas"

# Use SSL/TLS for database connection
export MONGODB_URI="mongodb://admin:password@localhost:27017/screenshot_saas?ssl=true"
```

### 3. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# View PM2 dashboard
pm2 monit

# View logs
pm2 logs screenshot-saas

# Restart if needed
pm2 restart screenshot-saas
```

### Log Management

```bash
# View application logs
tail -f logs/pm2-combined.log

# Rotate logs
pm2 install pm2-logrotate
```

### Health Checks

```bash
# Test health endpoint
curl https://screenshot.amazon.in/health

# Test API endpoint
curl https://screenshot.amazon.in/api/auth/login
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -ti:8002
   sudo kill -9 <PID>
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot renew --dry-run
   sudo systemctl reload nginx
   ```

3. **Database connection issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Test connection
   mongo $MONGODB_URI
   ```

4. **Permission issues**
   ```bash
   # Fix file permissions
   chmod +x deploy.sh
   chown -R $USER:$USER /path/to/screenshot-saas
   ```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL="debug"

# Check PM2 status
pm2 status

# View detailed logs
pm2 logs screenshot-saas --lines 100
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
mongodump --uri="$MONGODB_URI" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="$MONGODB_URI" /backup/20240101
```

### Application Backup

```bash
# Backup uploads and logs
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ logs/
```

## Scaling

### Horizontal Scaling

```bash
# Increase PM2 instances
export PM2_INSTANCES="8"
./deploy.sh restart production
```

### Load Balancing

Use nginx upstream for multiple servers:

```nginx
upstream screenshot_app {
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
    server 127.0.0.1:8004;
}

server {
    location / {
        proxy_pass http://screenshot_app;
    }
}
```

## Support

For issues and questions:
- Check logs: `./deploy.sh logs`
- Test deployment: `./deploy.sh test production`
- Review configuration: Check `deploy.config.local.sh`

---

*Last updated: January 2025*

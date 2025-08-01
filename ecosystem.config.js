module.exports = {
  apps: [
    {
      name: 'screenshot-saas',
      script: './backend/dist/index.js',
      cwd: '/Users/anishtr/CascadeProjects/screenshot-saas',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Database
        MONGODB_URI: 'mongodb://localhost:27017/screenshot_saas',
        
        // JWT
        JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
        JWT_EXPIRES_IN: '7d',
        
        // File Upload
        MAX_FILE_SIZE: '50mb',
        UPLOAD_TIMEOUT: '300000',
        
        // Screenshot Settings
        SCREENSHOT_TIMEOUT: '30000',
        CRAWL_TIMEOUT: '30000',
        CRAWL_MAX_PAGES: '50',
        
        // Rate Limiting
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX_REQUESTS: '10000',
        
        // Admin User (will be created if doesn't exist)
        ADMIN_EMAIL: 'admin@screenshot-saas.com',
        ADMIN_PASSWORD: 'admin123',
        
        // Logging
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart settings
      min_uptime: '10s',
      max_restarts: 10,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Node.js options
      node_args: '--max-old-space-size=1024'
    }
  ],
  
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/anishtr4/screenshuter.git',
      path: '/var/www/screenshot-saas',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

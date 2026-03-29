'use strict';

/**
 * ecosystem.config.js — PM2 Process Manager config
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart contact-manager
 *   pm2 stop contact-manager
 *   pm2 logs contact-manager
 */

module.exports = {
  apps: [
    {
      name: 'contact-manager',
      script: 'functions/index.js',

      // Chạy 1 instance (contact manager là personal use)
      instances: 1,
      exec_mode: 'fork',

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Log config
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/var/log/contact-manager/out.log',
      error_file: '/var/log/contact-manager/error.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Load .env file
      env_file: '.env',
    },
  ],
};

module.exports = {
  apps: [{
    name: 'app',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      ENVIRONMENT: 'dev'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      ENVIRONMENT: 'prod'
    },
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Performance tuning
    node_args: '--max-old-space-size=1024',
    
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    
    // Environment variables
    env_file: '.env'
  }]
};

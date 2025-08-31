module.exports = {
  apps: [{
    name: 'mosaic-react-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
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
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      ENVIRONMENT: 'staging'
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
    
    // Health check
    health_check_grace_period: 3000,
    
    // Environment variables
    env_file: '.env'
  }]
};

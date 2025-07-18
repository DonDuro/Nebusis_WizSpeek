module.exports = {
  apps: [{
    name: 'wizspeak-production',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    source_map_support: false,
    instance_var: 'INSTANCE_ID',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    vizion: false
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'YOUR_EC2_IP',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/wizspeak.git',
      path: '/opt/wizspeak',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
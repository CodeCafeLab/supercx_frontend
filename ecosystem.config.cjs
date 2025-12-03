module.exports = {
  apps: [{
    name: 'supercx-frontend',
    script: 'npx',
    args: 'vite preview --port 3012 --host',
    cwd: '/var/www/supercx_frontend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3012
    },
    error_file: '/var/log/pm2/supercx-frontend-error.log',
    out_file: '/var/log/pm2/supercx-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};

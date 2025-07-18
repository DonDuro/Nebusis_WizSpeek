#!/bin/bash
# WizSpeek® EC2 User Data Script for AWS Deployment

set -e

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install additional packages
yum install -y git postgresql-client nginx awscli

# Install PM2 globally
npm install -g pm2

# Create application user
useradd -m -s /bin/bash wizspeak
mkdir -p /opt/wizspeak
chown wizspeak:wizspeak /opt/wizspeak

# Create application directory structure
mkdir -p /opt/wizspeak/{logs,uploads,backups}
mkdir -p /var/log/wizspeak

# Create environment file
cat > /opt/wizspeak/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=${database_url}
REDIS_URL=${redis_url}
S3_BUCKET=${s3_bucket}
AWS_REGION=${aws_region}
JWT_SECRET=${jwt_secret}
EOF

# Set proper permissions
chown wizspeak:wizspeak /opt/wizspeak/.env
chmod 600 /opt/wizspeak/.env

# Create systemd service for WizSpeek
cat > /etc/systemd/system/wizspeak.service << EOF
[Unit]
Description=WizSpeek Application
After=network.target

[Service]
Type=simple
User=wizspeak
WorkingDirectory=/opt/wizspeak
Environment=NODE_ENV=production
EnvironmentFile=/opt/wizspeak/.env
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create logrotate configuration
cat > /etc/logrotate.d/wizspeak << EOF
/opt/wizspeak/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 wizspeak wizspeak
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF

# Create nginx configuration
cat > /etc/nginx/conf.d/wizspeak.conf << EOF
upstream wizspeak_app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name _;
    
    client_max_body_size 10M;
    
    location /health {
        access_log off;
        proxy_pass http://wizspeak_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /ws {
        proxy_pass http://wizspeak_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location / {
        proxy_pass http://wizspeak_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/wizspeak/logs/combined.log",
                        "log_group_name": "/aws/ec2/wizspeak/application",
                        "log_stream_name": "{instance_id}/application"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/wizspeak/nginx",
                        "log_stream_name": "{instance_id}/nginx-access"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/ec2/wizspeak/nginx",
                        "log_stream_name": "{instance_id}/nginx-error"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "WizSpeek/Application",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create deployment script
cat > /opt/wizspeak/deploy.sh << 'EOF'
#!/bin/bash
set -e

cd /opt/wizspeak

# Download latest release
aws s3 cp s3://wizspeak-deployments/releases/latest.tar.gz ./latest.tar.gz

# Extract and install
tar -xzf latest.tar.gz
npm install --production

# Run database migrations
npm run db:push

# Reload PM2 process
pm2 reload ecosystem.config.js

# Clean up
rm -f latest.tar.gz

echo "Deployment completed successfully!"
EOF

chmod +x /opt/wizspeak/deploy.sh
chown wizspeak:wizspeak /opt/wizspeak/deploy.sh

# Create health check script
cat > /opt/wizspeak/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for WizSpeek application

HEALTH_URL="http://localhost:3000/health"
TIMEOUT=10

# Check if application is responding
if curl -f -s --max-time $TIMEOUT $HEALTH_URL > /dev/null; then
    echo "Application is healthy"
    exit 0
else
    echo "Application is unhealthy"
    exit 1
fi
EOF

chmod +x /opt/wizspeak/health-check.sh
chown wizspeak:wizspeak /opt/wizspeak/health-check.sh

# Create backup script
cat > /opt/wizspeak/backup.sh << 'EOF'
#!/bin/bash
# Backup script for WizSpeek application

BACKUP_DIR="/opt/wizspeak/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wizspeak_backup_$TIMESTAMP.tar.gz"

# Create backup
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/$BACKUP_FILE -C /opt/wizspeak logs uploads

# Upload to S3
aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://${s3_bucket}/backups/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "wizspeak_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/wizspeak/backup.sh
chown wizspeak:wizspeak /opt/wizspeak/backup.sh

# Set up cron jobs
cat > /tmp/wizspeak-cron << EOF
# Health check every 5 minutes
*/5 * * * * /opt/wizspeak/health-check.sh >> /var/log/wizspeak/health.log 2>&1

# Backup every day at 2 AM
0 2 * * * /opt/wizspeak/backup.sh >> /var/log/wizspeak/backup.log 2>&1

# Log rotation
0 0 * * * /usr/sbin/logrotate /etc/logrotate.d/wizspeak
EOF

crontab -u wizspeak /tmp/wizspeak-cron
rm /tmp/wizspeak-cron

# Create initial application structure (will be replaced by actual deployment)
su - wizspeak << 'EOF'
cd /opt/wizspeak
git init
echo "# WizSpeek Application" > README.md
echo "Waiting for application deployment..." > index.js
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable wizspeak
# Service will start after application is deployed

# Final system configuration
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
sysctl -p

# Create success indicator
touch /opt/wizspeak/user-data-complete

echo "WizSpeek® EC2 initialization completed successfully!"
EOF
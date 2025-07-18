# WizSpeek® AWS Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying WizSpeek® - a secure, AI-powered messaging platform with ISO 9001/27001 compliance features - to AWS cloud infrastructure.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (AWS RDS)
- **Real-time**: WebSocket connections
- **Authentication**: JWT tokens with bcrypt
- **File Storage**: AWS S3 (for attachments)
- **Caching**: Redis (AWS ElastiCache)
- **CDN**: AWS CloudFront

### AWS Services Required
- **AWS EC2**: Application hosting
- **AWS RDS**: PostgreSQL database
- **AWS S3**: File storage
- **AWS ElastiCache**: Redis caching
- **AWS CloudFront**: CDN
- **AWS Route 53**: DNS management
- **AWS Certificate Manager**: SSL certificates
- **AWS Application Load Balancer**: Traffic distribution
- **AWS VPC**: Network isolation
- **AWS Security Groups**: Firewall rules

## Prerequisites

### Local Development Setup
1. Node.js 18+ installed
2. PostgreSQL client tools
3. AWS CLI configured
4. Docker (optional, for containerized deployment)

### AWS Account Setup
1. AWS account with appropriate permissions
2. AWS CLI configured with access keys
3. Domain name (optional, for custom domain)

## Deployment Steps

### Step 1: Database Setup (AWS RDS)

#### 1.1 Create RDS PostgreSQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier wizspeak-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username wizspeak_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name wizspeak-db-subnet-group \
  --port 5432 \
  --backup-retention-period 7 \
  --multi-az false \
  --publicly-accessible false
```

#### 1.2 Database Security Configuration
- Create dedicated VPC and subnets
- Configure security groups to allow connections only from application servers
- Enable encryption at rest
- Set up automated backups

### Step 2: Redis Cache Setup (AWS ElastiCache)

#### 2.1 Create ElastiCache Redis Cluster
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id wizspeak-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --port 6379 \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-group-name wizspeak-cache-subnet-group
```

### Step 3: S3 Bucket Setup

#### 3.1 Create S3 Bucket for File Storage
```bash
aws s3 mb s3://wizspeak-files-production
aws s3api put-bucket-versioning \
  --bucket wizspeak-files-production \
  --versioning-configuration Status=Enabled
```

#### 3.2 Configure S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "WizSpeakFileAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/WizSpeakEC2Role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::wizspeak-files-production/*"
    }
  ]
}
```

### Step 4: EC2 Instance Setup

#### 4.1 Launch EC2 Instance
```bash
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --key-name wizspeak-key \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=WizSpeek-Production}]'
```

#### 4.2 EC2 User Data Script (user-data.sh)
```bash
#!/bin/bash
yum update -y
yum install -y nodejs npm git postgresql-client

# Install PM2 for process management
npm install -g pm2

# Create application directory
mkdir -p /opt/wizspeak
cd /opt/wizspeak

# Clone or copy application code
# (In production, use CI/CD pipeline)
git clone YOUR_REPO_URL .

# Install dependencies
npm install

# Build application
npm run build

# Set environment variables
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://wizspeak_admin:YOUR_PASSWORD@wizspeak-db.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/wizspeak
JWT_SECRET=your-super-secure-jwt-secret-key-here
REDIS_URL=redis://wizspeak-redis.xxxxx.cache.amazonaws.com:6379
AWS_REGION=us-east-1
S3_BUCKET=wizspeak-files-production
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Step 5: Application Configuration

#### 5.1 Create ecosystem.config.js for PM2
```javascript
module.exports = {
  apps: [{
    name: 'wizspeak',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### 5.2 Update Production Environment Variables
```bash
# Create .env file with production values
DATABASE_URL=postgresql://wizspeak_admin:PASSWORD@wizspeak-db.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/wizspeak
JWT_SECRET=your-256-bit-secret-key-here
REDIS_URL=redis://wizspeak-redis.xxxxx.cache.amazonaws.com:6379
AWS_REGION=us-east-1
S3_BUCKET=wizspeak-files-production
NODE_ENV=production
PORT=3000
```

### Step 6: Load Balancer Setup

#### 6.1 Create Application Load Balancer
```bash
aws elbv2 create-load-balancer \
  --name wizspeak-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing \
  --type application
```

#### 6.2 Create Target Group
```bash
aws elbv2 create-target-group \
  --name wizspeak-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30
```

### Step 7: SSL Certificate (AWS Certificate Manager)

#### 7.1 Request SSL Certificate
```bash
aws acm request-certificate \
  --domain-name wizspeak.yourdomain.com \
  --validation-method DNS \
  --subject-alternative-names "*.wizspeak.yourdomain.com"
```

### Step 8: CloudFront CDN Setup

#### 8.1 Create CloudFront Distribution
```json
{
  "CallerReference": "wizspeak-cdn-2025",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "wizspeak-origin",
        "DomainName": "wizspeak-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "wizspeak-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {"Forward": "all"}
    }
  },
  "Comment": "WizSpeek CDN Distribution",
  "Enabled": true
}
```

## Database Migration

### Step 9: Database Schema Setup

#### 9.1 Run Database Migrations
```bash
# Connect to RDS instance
export DATABASE_URL="postgresql://wizspeak_admin:PASSWORD@wizspeak-db.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/wizspeak"

# Run Drizzle migrations
npm run db:push

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

## Security Configuration

### Step 10: Security Best Practices

#### 10.1 VPC Security Groups
```bash
# Application Server Security Group
aws ec2 create-security-group \
  --group-name wizspeak-app-sg \
  --description "WizSpeek Application Server Security Group"

# Allow HTTP/HTTPS from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 3000 \
  --source-group sg-alb-xxxxxxxxx

# Allow SSH for management
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0
```

#### 10.2 Database Security Group
```bash
# Database Security Group
aws ec2 create-security-group \
  --group-name wizspeak-db-sg \
  --description "WizSpeek Database Security Group"

# Allow PostgreSQL from application servers only
aws ec2 authorize-security-group-ingress \
  --group-id sg-db-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-xxxxxxxxx
```

## Monitoring and Logging

### Step 11: CloudWatch Setup

#### 11.1 CloudWatch Logs
```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure log groups
aws logs create-log-group --log-group-name /aws/ec2/wizspeak/application
aws logs create-log-group --log-group-name /aws/ec2/wizspeak/access
```

#### 11.2 CloudWatch Alarms
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name wizspeak-high-cpu \
  --alarm-description "WizSpeek High CPU Usage" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Backup and Recovery

### Step 12: Backup Strategy

#### 12.1 RDS Automated Backups
- Backup retention period: 7 days
- Backup window: 03:00-04:00 UTC
- Maintenance window: 04:00-05:00 UTC

#### 12.2 S3 File Backups
```bash
# Enable versioning and lifecycle policies
aws s3api put-bucket-lifecycle-configuration \
  --bucket wizspeak-files-production \
  --lifecycle-configuration file://lifecycle.json
```

## Domain and DNS Configuration

### Step 13: Route 53 Setup

#### 13.1 Create Hosted Zone
```bash
aws route53 create-hosted-zone \
  --name wizspeak.yourdomain.com \
  --caller-reference wizspeak-2025
```

#### 13.2 Create DNS Records
```bash
# A record pointing to CloudFront distribution
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1D633PJN98FT9 \
  --change-batch file://dns-records.json
```

## Scaling Configuration

### Step 14: Auto Scaling Setup

#### 14.1 Create Launch Template
```bash
aws ec2 create-launch-template \
  --launch-template-name wizspeak-template \
  --version-description "WizSpeek Launch Template" \
  --launch-template-data file://launch-template.json
```

#### 14.2 Auto Scaling Group
```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name wizspeak-asg \
  --launch-template LaunchTemplateName=wizspeak-template,Version=1 \
  --min-size 1 \
  --max-size 5 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/wizspeak-targets/1234567890123456
```

## Deployment Commands

### Step 15: Complete Deployment Script

#### 15.1 deployment.sh
```bash
#!/bin/bash
set -e

echo "Starting WizSpeek® AWS Deployment..."

# 1. Build application
echo "Building application..."
npm run build

# 2. Upload to S3 (for static assets)
echo "Uploading static assets..."
aws s3 sync ./dist s3://wizspeak-assets-production --delete

# 3. Deploy to EC2 instances
echo "Deploying to EC2..."
aws s3 cp ./dist.tar.gz s3://wizspeak-deployments/releases/

# 4. Update EC2 instances via Systems Manager
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /opt/wizspeak && ./deploy.sh"]' \
  --targets "Key=tag:Name,Values=WizSpeek-Production"

# 5. Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Deployment completed successfully!"
```

## Health Checks and Monitoring

### Step 16: Health Check Endpoints

#### 16.1 Application Health Check
The application includes a health check endpoint at `/health` that verifies:
- Database connectivity
- Redis connectivity
- Application status

#### 16.2 Monitoring Dashboard
Set up CloudWatch dashboard to monitor:
- Application response times
- Database performance
- WebSocket connections
- File upload metrics
- Compliance audit trails

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier wizspeak-db

# Test connection from EC2
psql -h wizspeak-db.cluster-xxxxx.us-east-1.rds.amazonaws.com -U wizspeak_admin -d wizspeak
```

#### Application Logs
```bash
# View PM2 logs
pm2 logs wizspeak

# View CloudWatch logs
aws logs tail /aws/ec2/wizspeak/application --follow
```

#### SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
```

## Cost Optimization

### Step 17: Cost Management

#### 17.1 Resource Optimization
- Use Reserved Instances for consistent workloads
- Implement Auto Scaling for variable loads
- Use S3 Intelligent Tiering for file storage
- Schedule non-production resources to shut down

#### 17.2 Cost Monitoring
- Set up billing alerts
- Use AWS Cost Explorer
- Regular cost reviews and optimization

## Compliance and Security

### Step 18: ISO 9001/27001 Compliance

#### 18.1 Audit Trail
- All compliance data is stored in PostgreSQL
- CloudTrail logs all AWS API calls
- Application logs all user activities

#### 18.2 Data Protection
- Encryption at rest (RDS, S3, EBS)
- Encryption in transit (SSL/TLS)
- Regular security updates and patching

## Final Checklist

### Pre-Launch Verification
- [ ] Database migrations completed
- [ ] SSL certificate installed and working
- [ ] Health checks passing
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented
- [ ] Security groups properly configured
- [ ] Domain DNS configured
- [ ] Load balancer health checks passing
- [ ] Auto scaling configured
- [ ] Compliance features tested

### Post-Launch Monitoring
- [ ] Application performance metrics
- [ ] Database performance metrics
- [ ] WebSocket connection stability
- [ ] File upload/download functionality
- [ ] Compliance audit trail generation
- [ ] Security monitoring alerts

## Support and Maintenance

### Regular Maintenance Tasks
- Weekly security updates
- Monthly performance reviews
- Quarterly security audits
- Annual compliance reviews

### Emergency Procedures
- Incident response plan
- Backup restoration procedures
- Scaling procedures for high traffic
- Security incident response

---

**Note**: This deployment guide assumes familiarity with AWS services and basic DevOps practices. For production deployments, consider using Infrastructure as Code (IaC) tools like Terraform or AWS CloudFormation for better management and repeatability.

**Security Notice**: Always use strong passwords, enable MFA, and follow AWS security best practices. Never commit sensitive information to version control.

**Compliance Notice**: This deployment includes comprehensive audit trails and compliance features required for ISO 9001/27001 certification.
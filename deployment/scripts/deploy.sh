#!/bin/bash
# WizSpeek® Complete Deployment Script for AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="wizspeak"
ENVIRONMENT="production"
AWS_REGION="us-east-1"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Build application
build_application() {
    print_status "Building WizSpeek® application..."
    
    # Install dependencies
    npm install
    
    # Build the application
    npm run build
    
    # Create deployment package
    mkdir -p dist/deployment
    cp -r server shared dist/deployment/
    cp package.json package-lock.json ecosystem.config.js dist/deployment/
    
    # Create deployment tarball
    cd dist/deployment
    tar -czf ../wizspeak-deployment.tar.gz .
    cd ../..
    
    print_success "Application built successfully"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    print_status "Deploying AWS infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -out=tfplan
    
    # Apply the deployment
    terraform apply tfplan
    
    # Get outputs
    terraform output -json > ../infrastructure-outputs.json
    
    cd ..
    
    print_success "Infrastructure deployed successfully"
}

# Deploy application
deploy_application() {
    print_status "Deploying WizSpeek® application..."
    
    # Upload deployment package to S3
    aws s3 cp dist/wizspeak-deployment.tar.gz s3://wizspeak-deployments/releases/latest.tar.gz
    
    # Get EC2 instance IDs from Auto Scaling Group
    ASG_NAME=$(jq -r '.auto_scaling_group_name.value' infrastructure-outputs.json)
    INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --query 'AutoScalingGroups[0].Instances[].InstanceId' --output text)
    
    # Deploy to each instance
    for INSTANCE_ID in $INSTANCE_IDS; do
        print_status "Deploying to instance $INSTANCE_ID..."
        
        aws ssm send-command \
            --instance-ids $INSTANCE_ID \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=["cd /opt/wizspeak && sudo -u wizspeak ./deploy.sh"]' \
            --output text
    done
    
    print_success "Application deployed successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Get database URL from outputs
    DB_URL=$(jq -r '.database_url.value' infrastructure-outputs.json)
    
    # Run migrations
    export DATABASE_URL=$DB_URL
    npm run db:push
    
    print_success "Database migrations completed"
}

# Setup monitoring and alerts
setup_monitoring() {
    print_status "Setting up monitoring and alerts..."
    
    # Create CloudWatch Log Groups
    aws logs create-log-group --log-group-name /aws/ec2/wizspeak/application --region $AWS_REGION || true
    aws logs create-log-group --log-group-name /aws/ec2/wizspeak/nginx --region $AWS_REGION || true
    
    # Create CloudWatch Dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name "WizSpeek-Production" \
        --dashboard-body file://cloudwatch-dashboard.json
    
    print_success "Monitoring setup completed"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Get load balancer DNS
    LB_DNS=$(jq -r '.load_balancer_dns.value' infrastructure-outputs.json)
    
    # Wait for application to be ready
    sleep 60
    
    # Check health endpoint
    if curl -f -s "http://$LB_DNS/health" > /dev/null; then
        print_success "Application is healthy and ready"
    else
        print_error "Application health check failed"
        exit 1
    fi
}

# Main deployment function
main() {
    print_status "Starting WizSpeek® deployment to AWS..."
    
    check_prerequisites
    build_application
    deploy_infrastructure
    run_migrations
    deploy_application
    setup_monitoring
    health_check
    
    print_success "WizSpeek® deployment completed successfully!"
    
    # Display connection information
    LB_DNS=$(jq -r '.load_balancer_dns.value' infrastructure-outputs.json)
    echo ""
    echo "🎉 WizSpeek® is now deployed and running!"
    echo "🌐 Access URL: http://$LB_DNS"
    echo "📊 CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=WizSpeek-Production"
    echo "🗄️ Database: $(jq -r '.database_endpoint.value' infrastructure-outputs.json)"
    echo "🔄 Redis: $(jq -r '.redis_endpoint.value' infrastructure-outputs.json)"
    echo "📦 S3 Bucket: $(jq -r '.s3_bucket_name.value' infrastructure-outputs.json)"
    echo ""
    echo "For SSL/HTTPS setup, please configure AWS Certificate Manager and update the load balancer listener."
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
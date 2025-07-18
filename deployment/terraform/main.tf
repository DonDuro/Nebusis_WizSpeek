# WizSpeek® AWS Infrastructure as Code
# Terraform configuration for complete AWS deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# VPC and Networking
resource "aws_vpc" "wizspeak_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "wizspeak-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "wizspeak_igw" {
  vpc_id = aws_vpc.wizspeak_vpc.id

  tags = {
    Name = "wizspeak-igw"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_subnets" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.wizspeak_vpc.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "wizspeak-public-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnets" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.wizspeak_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "wizspeak-private-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.wizspeak_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.wizspeak_igw.id
  }

  tags = {
    Name = "wizspeak-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public_rt_associations" {
  count          = length(aws_subnet.public_subnets)
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "alb_sg" {
  name        = "wizspeak-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.wizspeak_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "wizspeak-alb-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "app_sg" {
  name        = "wizspeak-app-sg"
  description = "Security group for WizSpeek application servers"
  vpc_id      = aws_vpc.wizspeak_vpc.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "wizspeak-app-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "db_sg" {
  name        = "wizspeak-db-sg"
  description = "Security group for WizSpeek database"
  vpc_id      = aws_vpc.wizspeak_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  tags = {
    Name = "wizspeak-db-sg"
    Environment = var.environment
  }
}

# Database Subnet Group
resource "aws_db_subnet_group" "wizspeak_db_subnet_group" {
  name       = "wizspeak-db-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = {
    Name = "wizspeak-db-subnet-group"
    Environment = var.environment
  }
}

# RDS PostgreSQL Database
resource "aws_db_instance" "wizspeak_db" {
  identifier     = "wizspeak-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "wizspeak"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.wizspeak_db_subnet_group.name
  
  backup_retention_period = var.db_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment == "development"
  deletion_protection = var.environment == "production"
  
  tags = {
    Name = "wizspeak-db"
    Environment = var.environment
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "wizspeak_cache_subnet_group" {
  name       = "wizspeak-cache-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = {
    Name = "wizspeak-cache-subnet-group"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "wizspeak_redis" {
  cluster_id           = "wizspeak-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.wizspeak_cache_subnet_group.name
  security_group_ids   = [aws_security_group.app_sg.id]

  tags = {
    Name = "wizspeak-redis"
    Environment = var.environment
  }
}

# S3 Bucket for File Storage
resource "aws_s3_bucket" "wizspeak_files" {
  bucket = "${var.s3_bucket_prefix}-${var.environment}"

  tags = {
    Name = "wizspeak-files"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "wizspeak_files_versioning" {
  bucket = aws_s3_bucket.wizspeak_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "wizspeak_files_encryption" {
  bucket = aws_s3_bucket.wizspeak_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "wizspeak_files_pab" {
  bucket = aws_s3_bucket.wizspeak_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for EC2 instances
resource "aws_iam_role" "wizspeak_ec2_role" {
  name = "wizspeak-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "wizspeak-ec2-role"
    Environment = var.environment
  }
}

resource "aws_iam_policy" "wizspeak_s3_policy" {
  name        = "wizspeak-s3-policy"
  description = "Policy for WizSpeek S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.wizspeak_files.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "wizspeak_s3_policy_attachment" {
  role       = aws_iam_role.wizspeak_ec2_role.name
  policy_arn = aws_iam_policy.wizspeak_s3_policy.arn
}

resource "aws_iam_instance_profile" "wizspeak_ec2_profile" {
  name = "wizspeak-ec2-profile"
  role = aws_iam_role.wizspeak_ec2_role.name
}

# Launch Template
resource "aws_launch_template" "wizspeak_lt" {
  name_prefix   = "wizspeak-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.ec2_instance_type
  key_name      = var.ec2_key_name

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.wizspeak_ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    database_url = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.wizspeak_db.endpoint}:5432/wizspeak"
    redis_url    = "redis://${aws_elasticache_cluster.wizspeak_redis.cache_nodes[0].address}:6379"
    s3_bucket    = aws_s3_bucket.wizspeak_files.bucket
    aws_region   = var.aws_region
    jwt_secret   = var.jwt_secret
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "wizspeak-instance"
      Environment = var.environment
    }
  }
}

# Application Load Balancer
resource "aws_lb" "wizspeak_alb" {
  name               = "wizspeak-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name = "wizspeak-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "wizspeak_tg" {
  name     = "wizspeak-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.wizspeak_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "wizspeak-tg"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "wizspeak_listener" {
  load_balancer_arn = aws_lb.wizspeak_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.wizspeak_tg.arn
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "wizspeak_asg" {
  name                = "wizspeak-asg"
  vpc_zone_identifier = aws_subnet.public_subnets[*].id
  target_group_arns   = [aws_lb_target_group.wizspeak_tg.arn]
  health_check_type   = "ELB"

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.wizspeak_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "wizspeak-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "wizspeak-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.wizspeak_asg.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "wizspeak-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.wizspeak_asg.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "wizspeak-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.wizspeak_asg.name
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "wizspeak-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.wizspeak_asg.name
  }
}
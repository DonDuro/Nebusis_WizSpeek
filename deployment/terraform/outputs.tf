# WizSpeek® Terraform Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.wizspeak_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.wizspeak_db.endpoint
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.wizspeak_db.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.wizspeak_redis.cache_nodes[0].address
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_cluster.wizspeak_redis.port
}

output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = aws_s3_bucket.wizspeak_files.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.wizspeak_files.arn
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.wizspeak_alb.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.wizspeak_alb.zone_id
}

output "auto_scaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.wizspeak_asg.name
}

output "database_url" {
  description = "Full database connection URL"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.wizspeak_db.endpoint}:5432/wizspeak"
  sensitive   = true
}

output "redis_url" {
  description = "Full Redis connection URL"
  value       = "redis://${aws_elasticache_cluster.wizspeak_redis.cache_nodes[0].address}:6379"
}
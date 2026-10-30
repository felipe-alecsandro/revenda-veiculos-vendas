output "ecr_repository_url" {
  value = aws_ecr_repository.sales.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.sales.name
}

output "ecs_service_name" {
  value = aws_ecs_service.sales.name
}

output "ecs_security_group_id" {
  value       = aws_security_group.ecs_tasks.id
  description = "Liberar este security group na porta 5432 do Postgres do catalogo."
}

output "alb_dns_name" {
  value = aws_lb.sales.dns_name
}

output "sales_base_url" {
  value = "http://${aws_lb.sales.dns_name}/v1"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "revenda-veiculos-vendas"
}

variable "ecr_repository_name" {
  type    = string
  default = "revenda-veiculos-vendas"
}

variable "cluster_name" {
  type    = string
  default = "revenda-veiculos-vendas-cluster"
}

variable "service_name" {
  type    = string
  default = "revenda-veiculos-vendas-service"
}

variable "task_definition_family" {
  type    = string
  default = "revenda-veiculos-vendas-task"
}

variable "container_name" {
  type    = string
  default = "revenda-veiculos-vendas"
}

variable "container_port" {
  type    = number
  default = 3001
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "alb_name" {
  type    = string
  default = "revenda-vendas-alb"
}

variable "target_group_name" {
  type    = string
  default = "revenda-vendas-tg"
}

variable "cors_origin" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "internal_api_token" {
  type      = string
  sensitive = true
}

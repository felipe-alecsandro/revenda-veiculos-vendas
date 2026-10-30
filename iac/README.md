# IaC - vendas

ECR, ECS Fargate, ALB e log group. O banco e o database `revenda_vendas`, outro que o do catalogo. A URL entra por variavel. Nao cria RDS nem CloudFront.

O security group das tasks precisa de entrada na porta 5432 do Postgres usado pelo servico principal.

```bash
cd iac/terraform
terraform init
terraform plan \
  -var="cors_origin=http://localhost:5173" \
  -var="database_url=postgresql://USER:PASSWORD@HOST:5432/revenda_vendas" \
  -var="internal_api_token=<token compartilhado com a API principal>"
```

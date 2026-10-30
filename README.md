# revenda-veiculos-vendas

Servico de venda de veiculos da Fase 4. Lista o que esta a venda, lista o que foi vendido, reserva uma compra com CPF e recebe o webhook de pagamento. O catalogo (cadastro e edicao) fica no `revenda-veiculos-api`. Os dois processos usam bancos diferentes e so se falam por HTTP.

## Como foi implementado

O servico principal grava o veiculo no database `revenda_veiculos` e faz `PUT /v1/integration/vehicles/:id` neste servico, com o header `x-internal-token`. Aqui a linha e uma projecao: marca, modelo, ano, cor, preco e imagem. O status de venda (`AVAILABLE`, `RESERVED`, `SOLD`) so muda neste banco.

`POST /v1/sales` com `{ vehicleId, cpf }` reserva o veiculo e devolve um `paymentCode`. A data da venda ainda nao existe. `POST /v1/payments/webhook` com `{ paymentCode, status }` efetiva (`PAID`, grava `soldAt`) ou cancela (`CANCELLED`, o veiculo volta a ficar a venda). Repetir o mesmo status nao duplica a venda. Trocar o status depois de pago ou cancelado responde 409.

Listagens:

- `GET /v1/vehicles` — so `AVAILABLE`, do menor preco para o maior.
- `GET /v1/vehicles/sold` — vendas `PAID`, ordenadas pelo preco gravado na venda.
- `GET /v1/sales?cpf=` — compras pagas daquele CPF.

Nao ha fila, gateway de pagamento nem Cognito. O webhook e o contrato que o processador chamaria.

## Como usar local

Postgres deste repositorio, quando o servico roda sozinho:

```bash
docker compose up -d
npm ci
cp .env.example .env
npm run migration:run
npm run start:dev
```

API: `http://localhost:3001/v1`

Swagger: `http://localhost:3001/v1/docs`

Para subir junto com o catalogo, nao ligue este compose. Use o compose do `revenda-veiculos-api`, que cria os databases `revenda_veiculos` e `revenda_vendas` na mesma instancia, porta 5432. Os dois composes usam a porta 5432 e nao podem ficar ligados ao mesmo tempo.

Se o volume do Postgres do catalogo ja existia antes da Fase 4:

```bash
docker exec -it revenda-veiculos-postgres psql -U revenda -d revenda_veiculos -c "CREATE DATABASE revenda_vendas;"
```

Fluxo manual:

```bash
curl -X PUT http://localhost:3001/v1/integration/vehicles/<UUID> \
  -H "Content-Type: application/json" \
  -H "x-internal-token: dev-internal-token" \
  -d '{"brand":"Fiat","model":"Mobi","year":2022,"color":"Branco","price":55000}'

curl -X POST http://localhost:3001/v1/sales \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"<UUID>","cpf":"52998224725"}'

curl -X POST http://localhost:3001/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"paymentCode":"<PAYMENT_CODE>","status":"PAID"}'
```

## Como testar

```bash
npm run lint
npm test
npm run build
```

`npm test` sobe a API em SQLite de memoria, percorre listagem, compra, CPF invalido, conflito, webhook pago, webhook cancelado, repeticao, codigo inexistente, upsert e delete. A cobertura minima dos services e controllers e 80%. O comando falha abaixo disso e imprime a tabela de cobertura.

## CI/CD

- CI: `.github/workflows/ci.yml` em pull request para `main` (lint, teste com cobertura, build).
- CD: `.github/workflows/cd.yml` no push da `main`, que e o merge na branch principal. Publica a imagem no ECR e atualiza o ECS.

Secrets: `AWS_GITHUB_ROLE_ARN`

Variables: `AWS_REGION`, `SALES_ECR_REPOSITORY`, `SALES_ECS_CLUSTER`, `SALES_ECS_SERVICE`, `SALES_CONTAINER_NAME`

## IaC

`iac/terraform` cria ECR, cluster ECS, service Fargate, ALB, security groups e log group. `DATABASE_URL` aponta para o database `revenda_vendas`. O security group de saida do ECS precisa alcancar o Postgres na porta 5432. O output `ecs_security_group_id` e o grupo a liberar.

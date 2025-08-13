# Infraestrutura AWS Serverless

Este diretório contém a infraestrutura como código (IaC) para o backend serverless da aplicação Todo List.

## Arquitetura

- **API Gateway**: REST API para endpoints de tarefas
- **Lambda**: Função serverless para lógica de negócio
- **DynamoDB**: Banco de dados NoSQL para persistência
- **IAM**: Roles e políticas de segurança

## Pré-requisitos

1. **AWS CLI** configurado com credenciais
2. **Terraform** >= 1.0 instalado
3. **Node.js** >= 18 para build do backend

## Configuração

### 1. Configurar AWS CLI
```bash
aws configure
# Digite suas credenciais AWS
```

### 2. Configurar variáveis
```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edite terraform.tfvars com seus valores
```

### 3. Build do backend
```bash
cd ../../backend
npm install
npm run package
```

## Deploy

### 1. Inicializar Terraform
```bash
cd infrastructure/terraform
terraform init
```

### 2. Planejar mudanças
```bash
terraform plan
```

### 3. Aplicar infraestrutura
```bash
terraform apply
```

### 4. Verificar outputs
```bash
terraform output
```

## Estrutura dos Arquivos

```
infrastructure/
├── terraform/
│   ├── main.tf              # Recursos principais
│   ├── variables.tf         # Definição de variáveis
│   ├── terraform.tfvars     # Valores das variáveis
│   └── README.md            # Esta documentação
└── backend/
    ├── src/                 # Código fonte TypeScript
    ├── dist/                # Build compilado
    ├── package.json         # Dependências
    └── tsconfig.json        # Configuração TypeScript
```

## Custos Estimados

- **Lambda**: $0.20/milhão de requests
- **DynamoDB**: $1.25/mês (25GB)
- **API Gateway**: $3.50/milhão de requests
- **Total**: **$5-15/mês** para uso moderado

## Endpoints da API

- `GET /tasks?userId={userId}` - Listar tarefas
- `GET /tasks/{id}?userId={userId}` - Obter tarefa específica
- `POST /tasks` - Criar nova tarefa
- `PUT /tasks/{id}` - Atualizar tarefa
- `DELETE /tasks/{id}` - Excluir tarefa

## Monitoramento

- **CloudWatch Logs**: Logs da função Lambda
- **CloudWatch Metrics**: Métricas de performance
- **X-Ray**: Tracing distribuído (opcional)

## Segurança

- **IAM**: Princípio do menor privilégio
- **CORS**: Configurado para desenvolvimento
- **Validação**: Input validation no Lambda
- **Auditoria**: CloudTrail para auditoria

## Troubleshooting

### Erro de permissão
```bash
# Verificar se o usuário tem permissões necessárias
aws sts get-caller-identity
```

### Lambda não executa
```bash
# Verificar logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/todo-list"
```

### DynamoDB não acessível
```bash
# Verificar se a tabela existe
aws dynamodb describe-table --table-name todo-list-tasks-dev
```

# Lista de Tarefas Kanban (PWA + AWS Serverless)

Aplicação Kanban em React + TypeScript + Vite, com PWA e arquitetura serverless na AWS. Funciona offline (PWA) e sincroniza dados via Lambda + DynamoDB.

## 🚀 Recursos

- **Frontend**: Kanban com drag-and-drop, PWA instalável
- **Backend**: AWS Lambda + DynamoDB + API Gateway
- **Arquitetura**: Serverless, escalável automaticamente
- **Persistência**: Local (offline) + Cloud (sincronização)
- **Exportar/Importar**: Backup em JSON

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend PWA  │    │   API Gateway   │    │   Lambda       │
│   (React/TS)    │◄──►│   (REST API)    │◄──►│   (Node.js)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   CloudWatch    │    │   DynamoDB      │
                       │   (Logs/Metrics)│    │   (Database)    │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Vite, PWA
- **Backend**: Node.js 20, TypeScript, AWS SDK v3
- **Infraestrutura**: Terraform, AWS Lambda, DynamoDB, API Gateway
- **Deploy**: GitHub Actions, AWS CLI

## 📱 Como Usar

### Opção 1: GitHub Pages (Gratuito)
```bash
# Acesse: https://brendonwalefy.github.io/todo-list/
# Funciona offline, dados salvos localmente
```

### Opção 2: Local + AWS Backend
```bash
# 1. Configure AWS CLI
aws configure

# 2. Deploy da infraestrutura
./scripts/deploy-aws.sh

# 3. Configure frontend para usar a API
# 4. Rode localmente
npm run dev
```

### Opção 3: Apenas Local
```bash
npm install
npm run dev
# Acesse: http://localhost:5173
```

## 🚀 Deploy na AWS

### Pré-requisitos
- AWS CLI configurado
- Terraform >= 1.0
- Node.js >= 18

### Deploy Automatizado
```bash
./scripts/deploy-aws.sh
```

### Deploy Manual
```bash
# 1. Build backend
cd backend
npm install
npm run package

# 2. Deploy infraestrutura
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## 💰 Custos AWS

- **Lambda**: $0.20/milhão de requests
- **DynamoDB**: $1.25/mês (25GB)
- **API Gateway**: $3.50/milhão de requests
- **Total estimado**: **$5-15/mês** para uso moderado

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
todo-list/
├── src/                    # Frontend React
├── backend/                # Lambda function
│   ├── src/               # Código TypeScript
│   └── dist/              # Build compilado
├── infrastructure/         # Terraform IaC
│   └── terraform/         # Configurações AWS
├── scripts/               # Scripts de deploy
└── public/                # Assets estáticos
```

### Comandos Úteis
```bash
# Frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview build

# Backend
cd backend
npm run build        # Compilar TypeScript
npm run package      # Criar lambda.zip

# Infraestrutura
cd infrastructure/terraform
terraform plan       # Planejar mudanças
terraform apply      # Aplicar mudanças
terraform destroy    # Remover recursos
```

## 🔐 Segurança

- **IAM**: Princípio do menor privilégio
- **CORS**: Configurado para desenvolvimento
- **Validação**: Input validation no Lambda
- **Auditoria**: CloudTrail habilitado

## 📊 Monitoramento

- **CloudWatch Logs**: Logs da função Lambda
- **CloudWatch Metrics**: Métricas de performance
- **X-Ray**: Tracing distribuído (opcional)

## 🚨 Troubleshooting

### Erro de permissão AWS
```bash
aws sts get-caller-identity
# Verificar se usuário tem permissões necessárias
```

### Lambda não executa
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/todo-list"
# Verificar logs da função
```

### Frontend não conecta na API
```bash
# Verificar URL da API no output do Terraform
terraform output api_gateway_url
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/BrendonWalefy/todo-list/issues)
- **Documentação**: [Wiki](https://github.com/BrendonWalefy/todo-list/wiki)
- **Discord**: [Servidor da Comunidade](link-discord)

---

**Desenvolvido com ❤️ por Brendon Walefy**


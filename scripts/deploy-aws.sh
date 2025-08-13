#!/bin/bash

# Script de deploy automatizado para AWS
set -e

echo "🚀 Iniciando deploy da infraestrutura AWS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI não está instalado"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        error "Terraform não está instalado"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado"
        exit 1
    fi
    
    log "✅ Pré-requisitos verificados"
}

# Build do backend
build_backend() {
    log "🔨 Buildando backend Lambda..."
    
    cd backend
    npm install
    npm run package
    
    if [ ! -f "../infrastructure/terraform/lambda.zip" ]; then
        error "Falha ao criar lambda.zip"
        exit 1
    fi
    
    log "✅ Backend buildado com sucesso"
    cd ..
}

# Deploy da infraestrutura
deploy_infrastructure() {
    log "🏗️ Deployando infraestrutura..."
    
    cd infrastructure/terraform
    
    # Inicializar Terraform se necessário
    if [ ! -d ".terraform" ]; then
        log "Inicializando Terraform..."
        terraform init
    fi
    
    # Verificar se terraform.tfvars existe
    if [ ! -f "terraform.tfvars" ]; then
        warn "terraform.tfvars não encontrado, criando exemplo..."
        cp terraform.tfvars.example terraform.tfvars
        echo "⚠️  Por favor, edite terraform.tfvars com suas configurações e rode novamente"
        exit 1
    fi
    
    # Planejar mudanças
    log "Planejando mudanças..."
    terraform plan -out=tfplan
    
    # Aplicar mudanças
    log "Aplicando mudanças..."
    terraform apply tfplan
    
    # Mostrar outputs
    log "📊 Outputs da infraestrutura:"
    terraform output
    
    cd ../..
}

# Testar API
test_api() {
    log "🧪 Testando API..."
    
    # Pegar URL da API do output do Terraform
    cd infrastructure/terraform
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
    cd ../..
    
    if [ -z "$API_URL" ]; then
        warn "Não foi possível obter URL da API, pulando testes"
        return
    fi
    
    log "API URL: $API_URL"
    
    # Teste simples de health check
    if curl -s "$API_URL" > /dev/null; then
        log "✅ API está respondendo"
    else
        warn "⚠️  API pode não estar respondendo"
    fi
}

# Main
main() {
    log "Iniciando deploy da Todo List na AWS..."
    
    check_prerequisites
    build_backend
    deploy_infrastructure
    test_api
    
    log "🎉 Deploy concluído com sucesso!"
    log "📱 Sua aplicação está rodando na AWS!"
    log "💡 Próximos passos:"
    log "   1. Configure o frontend para usar a nova API"
    log "   2. Teste as funcionalidades"
    log "   3. Configure monitoramento no CloudWatch"
}

# Executar main
main "$@"

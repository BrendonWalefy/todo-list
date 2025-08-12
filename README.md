# Lista de Tarefas Kanban (PWA)

Aplicação Kanban simples feita com React + TypeScript + Vite. Funciona offline (PWA), permite arrastar e soltar tarefas entre colunas e exportar/importar backup em JSON.

## Recursos
- Kanban com 3 colunas: A Fazer, Em Progresso e Concluídas
- Drag-and-drop nativo
- Persistência local (localStorage) e pedido de armazenamento persistente
- Exportar/Importar dados em JSON
- PWA: instalável e offline-first

## Rodando localmente
```bash
npm install
npm run dev
# abra http://localhost:5173
```

## Build de produção
```bash
npm run build
npx serve -s dist
```

## Deploy no GitHub Pages
O projeto está configurado com base `'/todo-list/'` em produção. O workflow cria e publica o build na branch `gh-pages`.

URL esperada: `https://BrendonWalefy.github.io/todo-list/`

## PWA
- A instalação aparece após abrir e recarregar a página uma vez
- Em Android/Chrome: “Instalar app”
- Em iOS/Safari: “Adicionar à Tela de Início”

## Backup
- Use os botões Exportar/Importar na interface para salvar/restaurar seus dados


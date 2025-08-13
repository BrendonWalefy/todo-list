# Lista de Tarefas Kanban (PWA)

Aplicação Kanban em React + TypeScript + Vite, com PWA e arquitetura em camadas (hexagonal/clean): domínio isolado, repositório local e shell de app. Visual e UX baseados no protótipo 6 (Foco/Flow/Exec, WIP, aging/stale, barra de ações fixa, tema claro/escuro).

## Recursos
- Kanban com colunas dinâmicas (adicionar ao final, renomear, WIP por coluna, reordenar via configurações)
- Modos de visualização: Foco (apenas “mine”), Flow (normal) e Exec (KPIs)
- Aging e stale: heatmap por idade e flag automática (>= 7 dias)
- Drag-and-drop de cards entre colunas
- PWA: instalável e offline-first
- Persistência local (localStorage) e pedido de armazenamento persistente
- Exportar/Importar JSON (compatível com formato antigo apenas-tarefas)

## Rodando localmente
```bash
npm install
npm run dev
# abra http://localhost:5173
```

Se a porta estiver em uso, pare execuções anteriores e rode:
```bash
pkill -f vite || true
npm run dev
```

## Build de produção
```bash
npm run build
npx serve -s dist
```

## Arquitetura (hexagonal/clean)
- `src/domain`: entidades e serviços puros (ex.: `Task`, `Column`, `BoardService`)
- `src/infrastructure`: repositórios/adapters (ex.: `LocalBoardRepository`)
- `src/app`: shell, visão e orquestração (ex.: `AppShell`)

## Uso (UI)
- Tema: canto superior direito (🌙/☀️)
- Barra fixa: “＋” para novo card, modos (Foco/Flow/Exec) e toggle de stale
- Configurações: engrenagem abre janela flutuante para gerenciar colunas (◀/▶ para reordenar)
- Novo card: define título, coluna, idade (dias), “atribuído a mim” e “bloqueado”

## PWA
- Após abrir a página, recarregue para o prompt de instalação
- Android/Chrome: “Instalar app”; iOS/Safari: “Adicionar à Tela de Início”

## Backup
- Botões Exportar/Importar na interface para salvar/restaurar dados


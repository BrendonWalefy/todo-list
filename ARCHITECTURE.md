# Arquitetura e Tecnologias

## Visão geral
Aplicação Kanban em camadas seguindo princípios de Arquitetura Hexagonal/Clean:
- Domínio isolado (entidades e regras puras)
- Infraestrutura como adaptadores (persistência local)
- Camada de aplicação/UI (orquestra fluxo, renderiza e interage)

## Diretórios
```text
src/
  app/                      # Shell do app (UI/orquestração)
    AppShell.tsx
  domain/                   # Domínio puro
    entities/
      Column.ts             # Tipo de coluna
      Task.ts               # Tipo de tarefa + util getTaskAgeDays
    services/
      BoardService.ts       # KPIs e defaults de board
  infrastructure/           # Adaptadores/portas de saída
    storage/
      LocalBoardRepository.ts  # Persistência em localStorage
  App.css                   # Estilos (tema claro/escuro, tokens)
  index.css                 # Base Vite
  main.tsx                  # Bootstrap → AppShell
public/
  prototypes/               # Protótipos estáticos de UI (ref visual)
```

## Fluxo (alto nível)
1. UI dispara ações (adicionar card, mover, gerenciar colunas)
2. AppShell aplica regras simples e atualiza estado de `tasks`/`columns`
3. Domínio provê utilidades puras (`BoardService.computeKpis`, `getTaskAgeDays`)
4. Repositório grava/lê do `localStorage` mantendo contratos do domínio

## Fronteiras e contratos
- Domínio não conhece UI nem storage
- `LocalBoardRepository` implementa a porta de saída de persistência local
- `AppShell` é a orquestração: injeta repo, usa serviços de domínio e renderiza

## UI e UX (mapeado ao domínio)
- Modos: Foco (filtra `mine`), Flow (padrão), Exec (KPIs do domínio)
- WIP por coluna (limite exibido, estado over informativo)
- Aging/Stale: `getTaskAgeDays` + heatmap CSS; stale ≥ 7 dias
- Gestão de colunas: renomear, WIP, adicionar ao final, reordenar (setas)
- Janelas flutuantes (arrastáveis) para Novo Card e Configurações
- Tema claro/escuro via `body[data-theme]` e tokens CSS

## Tecnologias utilizadas
- TypeScript (strict)
- React 18
- Vite 7
- vite-plugin-pwa (Workbox)
- CSS com custom properties (tokens de tema)
- localStorage
- HTML5 Drag-and-Drop
- ESLint
- Build: `tsc -b` + `vite build`
- Deploy: GitHub Pages (base configurada no Vite)

## Próximos passos / Pontos de extensão
- Interface `BoardRepository` no domínio e múltiplas implementações (REST/IndexedDB)
- Forecast (Monte Carlo) como serviço de domínio e componentes na Exec
- Testes unitários para `BoardService` e integração para `LocalBoardRepository`




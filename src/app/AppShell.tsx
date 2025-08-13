import { useEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import type { Column } from '../domain/entities/Column'
import type { Task } from '../domain/entities/Task'
import { getTaskAgeDays } from '../domain/entities/Task'
import { BoardService } from '../domain/services/BoardService'
import { LocalBoardRepository } from '../infrastructure/storage/LocalBoardRepository'

type Mode = 'focus' | 'flow' | 'exec'

const repo = new LocalBoardRepository()

function useTheme(): [string, (t: string) => void] {
  const [theme, setTheme] = useState<string>(() => {
    const stored = localStorage.getItem('todo-list.theme')
    if (stored === 'dark' || stored === 'light') return stored
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    return prefersLight ? 'light' : 'dark'
  })
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('todo-list.theme', theme)
  }, [theme])
  return [theme, setTheme]
}

export default function AppShell() {
  const [columns, setColumns] = useState<Column[]>(() => repo.readColumns())
  const [tasks, setTasks] = useState<Task[]>(() => repo.readTasks(columns))
  const [mode, setMode] = useState<Mode>('flow')
  const [staleEnabled, setStaleEnabled] = useState(true)
  const [theme, setTheme] = useTheme()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isColsOpen, setIsColsOpen] = useState(false)
  const [nowTick, setNowTick] = useState(() => Date.now())

  useEffect(() => { repo.writeTasks(tasks) }, [tasks])
  useEffect(() => { repo.writeColumns(columns) }, [columns])

  // Atualiza a cada 60s para recalcular idade dos cards
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('application/x.task-id', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('application/x.task-id')
    if (!taskId) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, doneAt: status === 'done' ? new Date().toISOString() : t.doneAt } : t)))
  }

  function addTask(data: { title: string; columnId: string; ageDays?: number; mine?: boolean; blocked?: boolean }) {
    const now = new Date()
    const created = new Date(now)
    if (data.ageDays && data.ageDays > 0) created.setDate(now.getDate() - data.ageDays)
    const task: Task = { id: crypto.randomUUID(), title: data.title, status: data.columnId, createdAt: created.toISOString(), mine: !!data.mine, blocked: !!data.blocked }
    setTasks((prev) => [task, ...prev])
  }

  function deleteTask(id: string) { setTasks((prev) => prev.filter((t) => t.id !== id)) }
  function clearDone() { setTasks((prev) => prev.filter((t) => t.status !== 'done')) }

  const kpi = useMemo(() => BoardService.computeKpis(tasks), [tasks])

  // Salva alterações de colunas (renomear, WIP, adicionar ao final, remover, mover)
  function saveColumnsEdits(edits: { index?: number; remove?: boolean; newCol?: { title: string; wipLimit: number }; rename?: string; wip?: number; move?: 'left' | 'right' }[]) {
    setColumns((prev) => {
      let cols = [...prev]
      edits.forEach((e) => {
        if (e.newCol) {
          cols = [...cols, { id: crypto.randomUUID(), title: e.newCol.title, wipLimit: e.newCol.wipLimit }]
        } else if (typeof e.index === 'number') {
          if (e.remove) {
            const col = cols[e.index]
            const dst = e.index === 0 ? (cols[1] ? cols[1].id : col.id) : cols[0].id
            setTasks((prevTasks) => prevTasks.map((t) => (t.status === col.id ? { ...t, status: dst } : t)))
            cols.splice(e.index, 1)
          } else {
            if (typeof e.wip === 'number') cols[e.index] = { ...cols[e.index], wipLimit: Math.max(0, e.wip) }
            if (typeof e.rename === 'string') cols[e.index] = { ...cols[e.index], title: e.rename }
            if (e.move === 'left' && e.index > 0) {
              const [c] = cols.splice(e.index, 1)
              cols.splice(e.index - 1, 0, c)
            }
            if (e.move === 'right' && e.index < cols.length - 1) {
              const [c] = cols.splice(e.index, 1)
              cols.splice(e.index + 1, 0, c)
            }
          }
        }
      })
      return cols
    })
  }

  // Import/Export
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  function handleExport() {
    const payload = { columns, tasks }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date(); const pad = (n: number) => String(n).padStart(2, '0')
    a.href = url; a.download = `kanban-backup-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }
  function triggerImport() { fileInputRef.current?.click() }
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]; if (!file) return
    try {
      const text = await file.text(); const parsed = JSON.parse(text)
      if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.tasks)) {
        const cols: Column[] = parsed.columns
        const valid = new Set(cols.map((c) => c.id))
        const imported: Task[] = parsed.tasks.filter(Boolean).map((t: any) => ({
          id: String(t.id ?? crypto.randomUUID()),
          title: String(t.title ?? ''),
          status: valid.has(t.status) ? String(t.status) : (cols[0]?.id ?? 'todo'),
          createdAt: String(t.createdAt ?? new Date().toISOString()),
          doneAt: t.doneAt ? String(t.doneAt) : undefined,
          mine: Boolean(t.mine),
          blocked: Boolean(t.blocked),
        }))
        setColumns(cols); setTasks(imported)
      } else if (Array.isArray(parsed)) {
        const imported: Task[] = parsed.filter(Boolean).map((t: any) => ({
          id: String(t.id ?? crypto.randomUUID()), title: String(t.title ?? ''),
          status: String(t.status ?? (t.completed ? 'done' : 'todo')),
          createdAt: String(t.createdAt ?? new Date().toISOString()),
          doneAt: t.doneAt ? String(t.doneAt) : undefined, mine: Boolean(t.mine), blocked: Boolean(t.blocked),
        }))
        setTasks(imported)
      } else { throw new Error('Formato inválido') }
      e.target.value = ''; alert('Importação concluída com sucesso!')
    } catch (err) { console.error(err); alert('Falha ao importar arquivo. Verifique o conteúdo do JSON.') }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand"><span className="dot" /> <h1>Kanban</h1></div>
        <div className="header-actions">
          <div className="theme-switch" role="group" aria-label="Tema">
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} title="Tema escuro">🌙</button>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} aria-pressed={theme === 'light'} title="Tema claro">☀️</button>
          </div>
          <button className="icon-btn" onClick={() => setIsColsOpen((v) => !v)} title="Gerenciar colunas" aria-label="Gerenciar colunas">⚙️</button>
        </div>
      </header>

      <section className="board-actions">
        <button className="icon-btn" onClick={() => setIsAddOpen((v) => !v)} title="Adicionar card" aria-label="Adicionar card">＋</button>
        <div className="modes">
          <button className={mode === 'focus' ? 'active' : ''} onClick={() => setMode('focus')} aria-pressed={mode === 'focus'}>Foco</button>
          <button className={mode === 'flow' ? 'active' : ''} onClick={() => setMode('flow')} aria-pressed={mode === 'flow'}>Flow</button>
          <button className={mode === 'exec' ? 'active' : ''} onClick={() => setMode('exec')} aria-pressed={mode === 'exec'}>Exec</button>
        </div>
        <label className="toggle"><input type="checkbox" checked={staleEnabled} onChange={(e) => setStaleEnabled(e.target.checked)} />Marcar stale</label>
        <div className="spacer" />
        <div className="footer-actions" role="group" aria-label="Backup">
          <button onClick={handleExport}>Exportar</button>
          <button onClick={triggerImport}>Importar</button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
          <button onClick={clearDone}>Limpar concluídas</button>
        </div>
      </section>

      {mode !== 'exec' && (
        <div className="board" aria-label="Board Kanban">
          {columns.map((col) => {
            const items = tasks.filter((t) => t.status === col.id)
            const visible = mode === 'focus' ? items.filter((t) => t.mine) : items
            const over = col.wipLimit > 0 && visible.length > col.wipLimit
            return (
              <section key={col.id} className="column" data-wip-limit={col.wipLimit} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)} aria-label={`Coluna ${col.title}`}>
                <header className="column__header">
                  <h2 className="column__title">{col.title}</h2>
                  <div className={`wip ${over ? 'over' : ''}`}><span className="tag">{visible.length}/{col.wipLimit}</span></div>
                </header>
                <ul className="column__list">
                  {visible.length === 0 && <li className="empty">Sem itens</li>}
                  {visible.map((task) => {
                    const age = getTaskAgeDays(task) + (nowTick ? 0 : 0) // usa nowTick para re-render periódica
                    const isStale = staleEnabled && age >= 7
                    const heat = age >= 7 ? 'heat-3' : age >= 5 ? 'heat-2' : age >= 3 ? 'heat-1' : ''
                    return (
                      <li key={task.id} className={`card ${heat} ${task.mine ? 'mine' : ''} ${task.blocked ? 'blocked' : ''}`} draggable onDragStart={(e) => handleDragStart(e, task.id)} aria-label={task.title}>
                        <div className="card__body">
                          <span className="card__title">{task.title}</span>
                        </div>
                        <div className="card__actions">
                          <button className="card__action delete" title="Excluir" onClick={() => deleteTask(task.id)}>✕</button>
                        </div>
                        <div className="card__footer">
                          {task.blocked && <span className="badge blocked">bloqueado</span>}
                          {isStale && <span className="badge stale">stale</span>}
                          <span className="age">{age}d</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
      {mode === 'exec' && (
        <section className="exec">
          <div className="tile"><div className="label">WIP atual</div><div className="value">{kpi.totalWip}</div></div>
          <div className="tile"><div className="label">Throughput (7/14/30d)</div><div className="value">{kpi.th7} / {kpi.th14} / {kpi.th30}</div></div>
          <div className="tile"><div className="label">Bloqueados</div><div className="value">{kpi.blocked}</div></div>
          <div className="tile forecast">
            <div>
              <div className="label">Forecast (p50)</div>
              <div className="value">—</div>
              <div className="hint">Monte Carlo não implementado neste MVP</div>
            </div>
            <div>
              <div className="label">Forecast (p85)</div>
              <div className="value">—</div>
              <div className="hint">Requer histórico adicional</div>
            </div>
            <div>
              <div className="label">Forecast (p95)</div>
              <div className="value">—</div>
              <div className="hint">Planejado para próxima etapa</div>
            </div>
          </div>
        </section>
      )}

      {isAddOpen && (
        <DraggableWindow title="Novo card" onClose={() => setIsAddOpen(false)}>
          <AddCardForm columns={columns} onCancel={() => setIsAddOpen(false)} onSubmit={(d) => { addTask(d); setIsAddOpen(false) }} />
        </DraggableWindow>
      )}

      {isColsOpen && (
        <DraggableWindow title="Gerenciar colunas" onClose={() => setIsColsOpen(false)}>
          <ManageColumns columns={columns} onClose={() => setIsColsOpen(false)} onSave={(edits) => { saveColumnsEdits(edits); setIsColsOpen(false) }} />
        </DraggableWindow>
      )}
    </div>
  )
}

function AddCardForm(props: { columns: Column[]; onCancel: () => void; onSubmit: (data: { title: string; columnId: string; ageDays?: number; mine?: boolean; blocked?: boolean }) => void }) {
  const [title, setTitle] = useState(''); const [columnId, setColumnId] = useState(props.columns[0]?.id ?? ''); const [age, setAge] = useState(0); const [mine, setMine] = useState(true); const [blocked, setBlocked] = useState(false)
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; props.onSubmit({ title: title.trim(), columnId, ageDays: age, mine, blocked }) }}>
      <div className="form-row"><label>Título<br /><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Implementar login" /></label></div>
      <div className="form-row inline">
        <label>Coluna<br />
          <select value={columnId} onChange={(e) => setColumnId(e.target.value)}>{props.columns.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}</select>
        </label>
        <label>Idade (dias)<br /><input type="number" min={0} value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
      </div>
      <div className="form-row checks">
        <label><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Atribuir a mim</label>
        <label><input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} /> Bloqueado</label>
      </div>
      <div className="actions"><button type="button" className="btn" onClick={props.onCancel}>Cancelar</button><button type="submit" className="btn">Adicionar</button></div>
    </form>
  )
}

function DraggableWindow(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({ x: 40, y: 80 }))
  const dragging = useRef<{ dx: number; dy: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    const el = e.currentTarget as HTMLElement
    const rect = el.parentElement?.getBoundingClientRect()
    if (!rect) return
    dragging.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const { dx, dy } = dragging.current
    const x = Math.max(8, e.clientX - dx)
    const y = Math.max(8, e.clientY - dy)
    setPos({ x, y })
  }
  function onPointerUp(e: React.PointerEvent) {
    dragging.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div className="floating-window" style={{ left: pos.x, top: pos.y }} role="dialog" aria-modal="true">
      <div className="floating-header" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="title">{props.title}</div>
        <button className="icon-btn" onClick={props.onClose} aria-label="Fechar">✕</button>
      </div>
      <div className="floating-body">{props.children}</div>
    </div>
  )
}

function ManageColumns(props: { columns: Column[]; onClose: () => void; onSave: (edits: { index?: number; remove?: boolean; newCol?: { title: string; wipLimit: number }; rename?: string; wip?: number; move?: 'left' | 'right' }[]) => void }) {
  const [rows, setRows] = useState<Array<{ title: string; wip: number; index?: number; remove?: boolean; isNew?: boolean }>>(() => props.columns.map((c, i) => ({ title: c.title, wip: c.wipLimit, index: i })))
  function addRow() { setRows((prev) => [...prev, { title: 'Nova coluna', wip: 3, isNew: true }]) }
  function removeRow(i: number) { setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, remove: true } : r))) }
  function move(i: number, dir: -1 | 1) { setRows((prev) => { const arr = [...prev]; const j = i + dir; if (j < 0 || j >= arr.length) return arr; const [it] = arr.splice(i, 1); arr.splice(j, 0, it); return arr }) }
  function save() {
    const edits: { index?: number; remove?: boolean; newCol?: { title: string; wipLimit: number }; rename?: string; wip?: number; move?: 'left' | 'right' }[] = []
    rows.forEach((r) => { if (r.isNew) edits.push({ newCol: { title: r.title.trim() || 'Nova coluna', wipLimit: Math.max(0, r.wip) } }) })
    props.columns.forEach((c, i) => {
      const row = rows.find((_, idx) => idx < props.columns.length && rows[idx].index === i) || rows[i]; if (!row) return
      if (row.remove) edits.push({ index: i, remove: true })
      if (row.wip !== c.wipLimit) edits.push({ index: i, wip: row.wip })
      if (row.title.trim() !== c.title) edits.push({ index: i, rename: row.title.trim() })
    })
    const originalOrder = props.columns.map((_, i) => i)
    const currentOrder = rows.map((r) => (typeof r.index === 'number' ? r.index : Infinity))
    originalOrder.forEach((origIdx, position) => { const currPos = currentOrder.indexOf(origIdx); if (currPos === -1) return; const delta = currPos - position; if (delta < 0) edits.push({ index: origIdx, move: 'left' }); if (delta > 0) edits.push({ index: origIdx, move: 'right' }) })
    props.onSave(edits)
  }
  return (
    <div className="cols-editor">
      {rows.map((r, i) => (
        <div key={i} className="row" style={{ opacity: r.remove ? 0.6 : 1 }}>
          <input className="col-name" type="text" value={r.title} onChange={(e) => setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
          <input className="col-wip" type="number" min={0} value={r.wip} onChange={(e) => setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, wip: Number(e.target.value) } : x)))} />
          <button className="icon-btn" onClick={() => move(i, -1)} title="Mover para a esquerda" aria-label="Mover para a esquerda">◀</button>
          <button className="icon-btn" onClick={() => move(i, 1)} title="Mover para a direita" aria-label="Mover para a direita">▶</button>
          <button className="icon-btn remove" onClick={() => removeRow(i)} title="Remover" aria-label="Remover">🗑️</button>
        </div>
      ))}
      <div className="actions"><button className="btn" onClick={addRow}>Adicionar coluna</button><span style={{ flex: 1 }} /><button className="btn" onClick={props.onClose}>Fechar</button><button className="btn" onClick={save}>Salvar</button></div>
    </div>
  )
}



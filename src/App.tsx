import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type TaskStatus = 'todo' | 'doing' | 'done'

type Task = {
  id: string
  title: string
  status: TaskStatus
  createdAt: string
  // Backward compatibility with previous schema
  completed?: boolean
}

const STORAGE_KEY = 'todo-list.tasks'

function readTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Task[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(Boolean)
      .map((t) => ({
        ...t,
        status: (t as any).status ?? ((t as any).completed ? 'done' : 'todo'),
      }))
  } catch {
    return []
  }
}

function writeTasksToStorage(tasks: Task[]) {
  try {
    // Persist status and helpful completed flag for compatibility
    const serialized = tasks.map((t) => ({ ...t, completed: t.status === 'done' }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
  } catch {
    // ignore write errors
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => readTasksFromStorage())
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    writeTasksToStorage(tasks)
  }, [tasks])

  // Tenta tornar o armazenamento mais persistente (quando suportado)
  useEffect(() => {
    const storageManager: any = (navigator as any).storage
    if (storageManager && typeof storageManager.persist === 'function') {
      try {
        storageManager.persist()
      } catch {
        // ignore
      }
    }
  }, [])

  const remainingCount = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks])

  const columns: { key: TaskStatus; title: string }[] = useMemo(
    () => [
      { key: 'todo', title: 'A Fazer' },
      { key: 'doing', title: 'Em Progresso' },
      { key: 'done', title: 'Concluídas' },
    ],
    [],
  )

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      status: 'todo',
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [task, ...prev])
    setNewTaskTitle('')
  }

  function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  function handleClearCompleted() {
    setTasks((prev) => prev.filter((t) => t.status !== 'done'))
  }

  function handleAdvance(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        if (t.status === 'todo') return { ...t, status: 'doing' }
        if (t.status === 'doing') return { ...t, status: 'done' }
        return t
      }),
    )
  }

  function handleMoveTo(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  const DND_MIME = 'application/x.task-id'

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData(DND_MIME, taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData(DND_MIME)
    if (!taskId) return
    handleMoveTo(taskId, status)
  }

  // Backup e restauração (Exportar/Importar)
  function handleExport() {
    const data = tasks
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fileName = `kanban-backup-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  function triggerImport() {
    fileInputRef.current?.click()
  }
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('Formato inválido')
      const incoming: Task[] = parsed
        .filter(Boolean)
        .map((t: any) => ({
          id: String(t.id ?? crypto.randomUUID()),
          title: String(t.title ?? ''),
          status: (t.status as TaskStatus) ?? (t.completed ? 'done' : 'todo'),
          createdAt: String(t.createdAt ?? new Date().toISOString()),
        }))
        .filter((t) => t.title.trim().length > 0)

      // mescla por id (substitui existentes e adiciona novos)
      setTasks((prev) => {
        const byId = new Map(prev.map((t) => [t.id, t]))
        for (const it of incoming) byId.set(it.id, it)
        // mantém ordem: itens recém-importados primeiro
        const importedIds = new Set(incoming.map((t) => t.id))
        const merged: Task[] = [
          ...incoming,
          ...prev.filter((t) => !importedIds.has(t.id)),
        ]
        // garante consistência com o Map em caso de conflito
        return merged.map((t) => byId.get(t.id)!)
      })
      // limpa input para permitir importar o mesmo arquivo novamente se quiser
      e.target.value = ''
      alert('Importação concluída com sucesso!')
    } catch (err) {
      console.error(err)
      alert('Falha ao importar arquivo. Verifique o conteúdo do JSON.')
    }
  }

  return (
    <div className="app">
      <h1 className="app__title">Lista de Tarefas</h1>

      <form className="todo-form" onSubmit={handleAddTask}>
        <input
          className="todo-input"
          type="text"
          placeholder="Adicionar nova tarefa..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          aria-label="Título da tarefa"
        />
        <button className="todo-add" type="submit" disabled={!newTaskTitle.trim()}>
          Adicionar
        </button>
      </form>

      <div className="board-meta">
        <div className="counter" aria-live="polite">
          {remainingCount} restante{remainingCount === 1 ? '' : 's'}
        </div>
        <div className="footer-actions" role="group" aria-label="Ações de backup e limpeza">
          <button onClick={handleExport}>Exportar</button>
          <button onClick={triggerImport}>Importar</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
          <button className="clear-completed" onClick={handleClearCompleted}>
            Limpar concluídas
          </button>
        </div>
      </div>

      <div className="board">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col.key)
          return (
            <section
              key={col.key}
              className={`column column--${col.key}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
              aria-label={`Coluna ${col.title}`}
            >
              <header className="column__header">
                <h2 className="column__title">{col.title}</h2>
                <span className="column__count">{items.length}</span>
              </header>
              <ul className="column__list">
                {items.length === 0 && <li className="empty">Sem itens</li>}
                {items.map((task) => (
                  <li
                    key={task.id}
                    className="card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    aria-label={task.title}
                  >
                    <div className="card__body">
                      <span className="card__title">{task.title}</span>
                    </div>
                    <div className="card__actions">
                      {task.status !== 'done' ? (
                        <button
                          className="card__action"
                          title="Avançar"
                          onClick={() => handleAdvance(task.id)}
                        >
                          ➜
                        </button>
                      ) : null}
                      <button
                        className="card__action delete"
                        title="Excluir"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default App

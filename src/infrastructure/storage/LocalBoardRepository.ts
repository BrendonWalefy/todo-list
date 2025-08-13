import type { Task } from '../../domain/entities/Task'
import type { Column } from '../../domain/entities/Column'
import { BoardService } from '../../domain/services/BoardService'

const STORAGE_TASKS = 'todo-list.tasks'
const STORAGE_COLS = 'todo-list.columns'

export class LocalBoardRepository {
  readColumns(): Column[] {
    try {
      const raw = localStorage.getItem(STORAGE_COLS)
      if (!raw) return BoardService.defaultColumns()
      const parsed = JSON.parse(raw) as Column[]
      if (!Array.isArray(parsed) || parsed.length === 0) return BoardService.defaultColumns()
      return parsed
    } catch {
      return BoardService.defaultColumns()
    }
  }

  writeColumns(columns: Column[]) {
    try { localStorage.setItem(STORAGE_COLS, JSON.stringify(columns)) } catch {}
  }

  readTasks(columns: Column[]): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_TASKS)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Task[]
      if (!Array.isArray(parsed)) return []
      const valid = new Set(columns.map((c) => c.id))
      return parsed.filter(Boolean).map((t) => {
        const status = (t as any).status ?? ((t as any).completed ? 'done' : 'todo')
        const normalized = valid.has(status) ? status : columns[0]?.id ?? 'todo'
        return { ...t, status: normalized }
      })
    } catch {
      return []
    }
  }

  writeTasks(tasks: Task[]) {
    try {
      const serialized = tasks.map((t) => ({ ...t, completed: t.status === 'done' }))
      localStorage.setItem(STORAGE_TASKS, JSON.stringify(serialized))
    } catch {}
  }
}



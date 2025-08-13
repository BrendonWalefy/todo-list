import type { Task } from '../entities/Task'
import type { Column } from '../entities/Column'

export type BoardKpis = {
  totalWip: number
  blocked: number
  th7: number
  th14: number
  th30: number
}

export class BoardService {
  static computeKpis(tasks: Task[]): BoardKpis {
    const totalWip = tasks.filter((t) => t.status !== 'done').length
    const blocked = tasks.filter((t) => t.blocked).length
    const since = (days: number) => {
      const cut = Date.now() - days * 24 * 60 * 60 * 1000
      return tasks.filter((t) => t.status === 'done' && t.doneAt && new Date(t.doneAt).getTime() >= cut).length
    }
    return { totalWip, blocked, th7: since(7), th14: since(14), th30: since(30) }
  }

  static defaultColumns(): Column[] {
    return [
      { id: 'todo', title: 'A Fazer', wipLimit: 3 },
      { id: 'doing', title: 'Em Progresso', wipLimit: 2 },
      { id: 'done', title: 'Concluídas', wipLimit: 4 },
    ]
  }
}



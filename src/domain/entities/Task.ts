export type Task = {
  id: string
  title: string
  status: string
  createdAt: string
  doneAt?: string
  mine?: boolean
  blocked?: boolean
  completed?: boolean
}

export function getTaskAgeDays(task: Pick<Task, 'createdAt'>): number {
  const created = new Date(task.createdAt)
  const diff = Date.now() - created.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}



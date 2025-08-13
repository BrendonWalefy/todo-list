import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/Task';

export interface TaskRepository {
  createTask(task: CreateTaskRequest, userId: string): Promise<Task>;
  getTask(id: string, userId: string): Promise<Task | null>;
  getTasks(userId: string): Promise<Task[]>;
  updateTask(id: string, updates: UpdateTaskRequest, userId: string): Promise<Task>;
  deleteTask(id: string, userId: string): Promise<void>;
  getTasksByStatus(userId: string, status: string): Promise<Task[]>;
}

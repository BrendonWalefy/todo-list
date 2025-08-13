import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/Task';
import { TaskRepository } from '../repositories/TaskRepository';

export class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async createTask(taskData: CreateTaskRequest, userId: string): Promise<Task> {
    // Validate task data
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new Error('Task title is required');
    }

    if (taskData.title.length > 200) {
      throw new Error('Task title cannot exceed 200 characters');
    }

    // Set default values
    const taskToCreate: CreateTaskRequest = {
      ...taskData,
      title: taskData.title.trim(),
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium'
    };

    return await this.taskRepository.createTask(taskToCreate, userId);
  }

  async getTask(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.getTask(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return await this.taskRepository.getTasks(userId);
  }

  async updateTask(id: string, updates: UpdateTaskRequest, userId: string): Promise<Task> {
    // Validate task exists
    const existingTask = await this.taskRepository.getTask(id, userId);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Validate updates
    if (updates.title !== undefined && updates.title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }

    if (updates.title !== undefined && updates.title.length > 200) {
      throw new Error('Task title cannot exceed 200 characters');
    }

    // Prepare updates
    const updatesToApply: UpdateTaskRequest = { ...updates };
    if (updates.title !== undefined) {
      updatesToApply.title = updates.title.trim();
    }

    return await this.taskRepository.updateTask(id, updatesToApply, userId);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    // Validate task exists
    const existingTask = await this.taskRepository.getTask(id, userId);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    await this.taskRepository.deleteTask(id, userId);
  }

  async getTasksByStatus(userId: string, status: string): Promise<Task[]> {
    return await this.taskRepository.getTasksByStatus(userId, status);
  }

  async moveTask(id: string, newStatus: string, userId: string): Promise<Task> {
    const validStatuses = ['todo', 'doing', 'done', 'blocked'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }

    return await this.updateTask(id, { status: newStatus as any }, userId);
  }

  async getTaskStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const tasks = await this.getTasks(userId);
    
    const byStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = tasks.reduce((acc, task) => {
      acc[task.priority || 'medium'] = (acc[task.priority || 'medium'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: tasks.length,
      byStatus,
      byPriority
    };
  }
}

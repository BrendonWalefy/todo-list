export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  assignedTo?: string;
  blocked?: boolean;
  estimatedHours?: number;
  actualHours?: number;
}

export type TaskStatus = 'todo' | 'doing' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateTaskRequest {
  title: string;
  status?: TaskStatus;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  assignedTo?: string;
  blocked?: boolean;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  status?: TaskStatus;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  assignedTo?: string;
  blocked?: boolean;
  estimatedHours?: number;
  actualHours?: number;
}

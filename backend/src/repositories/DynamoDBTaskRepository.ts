import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/Task';
import { TaskRepository } from './TaskRepository';

export class DynamoDBTaskRepository implements TaskRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE || 'todo-list-tasks-dev';
  }

  async createTask(taskData: CreateTaskRequest, userId: string): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: this.generateId(),
      ...taskData,
      userId,
      status: taskData.status || 'todo',
      createdAt: now,
      updatedAt: now
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: task
    }));

    return task;
  }

  async getTask(id: string, userId: string): Promise<Task | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { id, userId }
    }));

    return result.Item as Task || null;
  }

  async getTasks(userId: string): Promise<Task[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return (result.Items || []) as Task[];
  }

  async updateTask(id: string, updates: UpdateTaskRequest, userId: string): Promise<Task> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        
        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    });

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id, userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as Task;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { id, userId }
    }));
  }

  async getTasksByStatus(userId: string, status: string): Promise<Task[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdStatusIndex',
      KeyConditionExpression: 'userId = :userId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': status
      }
    }));

    return (result.Items || []) as Task[];
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

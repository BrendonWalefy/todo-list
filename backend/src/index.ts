import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TaskService } from './services/TaskService';
import { DynamoDBTaskRepository } from './repositories/DynamoDBTaskRepository';
import { Task } from './models/Task';

const taskRepository = new DynamoDBTaskRepository();
const taskService = new TaskService(taskRepository);

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, body, queryStringParameters } = event;
    
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    // Handle OPTIONS for CORS
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Extract userId from query params (in production, use JWT token)
    const userId = queryStringParameters?.userId || 'default-user';

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get single task
          const task = await taskService.getTask(pathParameters.id, userId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(task)
          };
        } else {
          // Get all tasks for user
          const tasks = await taskService.getTasks(userId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(tasks)
          };
        }

      case 'POST':
        // Create new task
        const newTask: Partial<Task> = JSON.parse(body || '{}');
        const createdTask = await taskService.createTask(newTask, userId);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(createdTask)
        };

      case 'PUT':
        // Update task
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Task ID is required' })
          };
        }
        const updateData: Partial<Task> = JSON.parse(body || '{}');
        const updatedTask = await taskService.updateTask(pathParameters.id, updateData, userId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedTask)
        };

      case 'DELETE':
        // Delete task
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Task ID is required' })
          };
        }
        await taskService.deleteTask(pathParameters.id, userId);
        return {
          statusCode: 204,
          headers,
          body: ''
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

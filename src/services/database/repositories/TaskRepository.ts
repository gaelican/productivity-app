import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../index';
import Task from '../models/Task';
import { TaskParser } from '../../../core/tasks/parser/TaskParser';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

interface CreateTaskInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: number;
  dueTime?: string;
  userId: string;
  goalId?: string;
  routineId?: string;
  parentTaskId?: string;
  tags?: string[];
  parsedInput?: string;
}

interface UpdateTaskInput {
  name?: string;
  description?: string;
  notes?: string;
  icon?: string;
  color?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: number;
  dueTime?: string;
  isCompleted?: boolean;
  progress?: number;
  tags?: string[];
  goalId?: string;
}

interface TaskQuery {
  userId?: string;
  isCompleted?: boolean;
  priority?: string;
  goalId?: string;
  routineId?: string;
  search?: string;
  dueBefore?: number;
  dueAfter?: number;
}

export class TaskRepository {
  private taskParser: TaskParser;

  constructor() {
    this.taskParser = new TaskParser();
  }

  // Create task from natural language input
  async createFromNaturalLanguage(input: string, userId: string): Promise<Task> {
    const parsed = await this.taskParser.parse(input);
    
    const taskData: CreateTaskInput = {
      name: parsed.task,
      description: parsed.description,
      icon: '📝', // Default icon
      color: '#4B9BFF', // Default color
      priority: parsed.priority || 'medium',
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      userId,
      tags: parsed.tags,
      parsedInput: input,
    };

    return this.create(taskData);
  }

  // Create a new task
  async create(data: CreateTaskInput): Promise<Task> {
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    
    return await database.write(async () => {
      const task = await tasksCollection.create((task: any) => {
        task.name = data.name;
        task.description = data.description || '';
        task.notes = '';
        task.icon = data.icon || '📝';
        task.color = data.color || '#4B9BFF';
        task.priority = data.priority || 'medium';
        task.dueDate = data.dueDate;
        task.dueTime = data.dueTime;
        task.isCompleted = false;
        task.progress = 0;
        task.userId = data.userId;
        task.goalId = data.goalId;
        task.routineId = data.routineId;
        task.parentTaskId = data.parentTaskId;
        task.tags = data.tags || [];
        task.parsedInput = data.parsedInput;
        
        // Sync metadata
        task.deviceId = this.getDeviceId();
        task.version = 1;
        task.syncStatus = 'pending';
      });

      // Add to sync queue
      await this.addToSyncQueue('create', task);

      return task as Task;
    });
  }

  // Update an existing task
  async update(taskId: string, data: UpdateTaskInput): Promise<Task> {
    const task = await this.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const database = await getDatabase();
    return await database.write(async () => {
      await task.update((t: any) => {
        if (data.name !== undefined) t.name = data.name;
        if (data.description !== undefined) t.description = data.description;
        if (data.notes !== undefined) t.notes = data.notes;
        if (data.icon !== undefined) t.icon = data.icon;
        if (data.color !== undefined) t.color = data.color;
        if (data.priority !== undefined) t.priority = data.priority;
        if (data.dueDate !== undefined) t.dueDate = data.dueDate;
        if (data.dueTime !== undefined) t.dueTime = data.dueTime;
        if (data.isCompleted !== undefined) {
          t.isCompleted = data.isCompleted;
          t.completedAt = data.isCompleted ? Date.now() : undefined;
        }
        if (data.progress !== undefined) t.progress = data.progress;
        if (data.tags !== undefined) t.tags = data.tags;
        if (data.goalId !== undefined) t.goalId = data.goalId;
        
        // Update sync metadata
        t.version += 1;
        t.syncStatus = 'pending';
      });

      // Add to sync queue
      await this.addToSyncQueue('update', task);

      return task;
    });
  }

  // Delete a task
  async delete(taskId: string): Promise<void> {
    const task = await this.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const database = await getDatabase();
    await database.write(async () => {
      // Add to sync queue before deletion
      await this.addToSyncQueue('delete', task);
      
      // Mark as deleted or actually delete based on sync strategy
      await task.markAsDeleted();
    });
  }

  // Find task by ID
  async findById(taskId: string): Promise<Task | null> {
    try {
      const database = await getDatabase();
      const tasksCollection = database.get('tasks');
      const task = await tasksCollection.find(taskId);
      return task as Task;
    } catch (error) {
      return null;
    }
  }

  // Query tasks with filters
  async query(filters: TaskQuery = {}): Promise<Task[]> {
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    let query = tasksCollection.query();

    if (filters.userId) {
      query = query.extend(Q.where('user_id', filters.userId));
    }

    if (filters.isCompleted !== undefined) {
      query = query.extend(Q.where('is_completed', filters.isCompleted));
    }

    if (filters.priority) {
      query = query.extend(Q.where('priority', filters.priority));
    }

    if (filters.goalId) {
      query = query.extend(Q.where('goal_id', filters.goalId));
    }

    if (filters.routineId) {
      query = query.extend(Q.where('routine_id', filters.routineId));
    }

    if (filters.dueBefore) {
      query = query.extend(Q.where('due_date', Q.lt(filters.dueBefore)));
    }

    if (filters.dueAfter) {
      query = query.extend(Q.where('due_date', Q.gt(filters.dueAfter)));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      query = query.extend(
        Q.or(
          Q.where('name', Q.like(`%${searchLower}%`)),
          Q.where('description', Q.like(`%${searchLower}%`))
        )
      );
    }

    const tasks = await query.fetch();
    return tasks as Task[];
  }

  // Get tasks for dashboard
  async getActiveTasks(userId: string, limit?: number): Promise<Task[]> {
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    let query = tasksCollection.query(
      Q.where('user_id', userId),
      Q.where('is_completed', false),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('due_date', Q.asc)
    );

    if (limit) {
      query = query.extend(Q.take(limit));
    }

    const tasks = await query.fetch();
    return tasks as Task[];
  }

  // Get completed tasks
  async getCompletedTasks(userId: string, limit?: number): Promise<Task[]> {
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    let query = tasksCollection.query(
      Q.where('user_id', userId),
      Q.where('is_completed', true),
      Q.sortBy('completed_at', Q.desc)
    );

    if (limit) {
      query = query.extend(Q.take(limit));
    }

    const tasks = await query.fetch();
    return tasks as Task[];
  }

  // Get overdue tasks
  async getOverdueTasks(userId: string): Promise<Task[]> {
    const now = Date.now();
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    const tasks = await tasksCollection.query(
      Q.where('user_id', userId),
      Q.where('is_completed', false),
      Q.where('due_date', Q.lt(now))
    ).fetch();

    return tasks as Task[];
  }

  // Get tasks by tag
  async getTasksByTag(userId: string, tag: string): Promise<Task[]> {
    const allTasks = await this.getActiveTasks(userId);
    return allTasks.filter(task => task.tags.includes(tag));
  }

  // Batch create tasks
  async batchCreate(tasksData: CreateTaskInput[]): Promise<Task[]> {
    const database = await getDatabase();
    const tasks = await database.write(async () => {
      const createdTasks = await Promise.all(
        tasksData.map(data => this.create(data))
      );
      return createdTasks;
    });

    return tasks;
  }

  // Toggle task completion
  async toggleCompletion(taskId: string): Promise<Task> {
    const task = await this.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.isCompleted) {
      await task.uncomplete();
    } else {
      await task.complete();
    }

    // Add to sync queue
    await this.addToSyncQueue('update', task);

    return task;
  }

  // Update task progress
  async updateProgress(taskId: string, progress: number): Promise<Task> {
    const task = await this.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    await task.updateProgress(progress);
    
    // Add to sync queue
    await this.addToSyncQueue('update', task);

    return task;
  }

  // Get sync queue for offline support
  private async addToSyncQueue(operation: 'create' | 'update' | 'delete', task: Task): Promise<void> {
    // This would be implemented with the sync_queue table
    // For now, we'll just log it
    console.log(`Added to sync queue: ${operation} task ${task.id}`);
  }

  // Get device ID for sync
  private getDeviceId(): string {
    // In a real app, this would be persisted
    if (Platform.OS === 'web') {
      return 'web-' + (localStorage.getItem('deviceId') || this.generateDeviceId());
    }
    // For native, use a proper device ID library
    return 'device-' + this.generateDeviceId();
  }

  private generateDeviceId(): string {
    const id = uuidv4();
    if (Platform.OS === 'web') {
      localStorage.setItem('deviceId', id);
    }
    return id;
  }
}

// Export singleton instance
export const taskRepository = new TaskRepository();
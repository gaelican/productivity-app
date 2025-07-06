import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../index';
import Routine from '../models/Routine';
import Task from '../models/Task';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

interface CreateRoutineInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduleConfig?: {
    days?: number[];
    dates?: number[];
    time?: string;
    interval?: number;
    unit?: 'days' | 'weeks' | 'months';
  };
  hideTasksOnDashboard?: boolean;
  userId: string;
  taskTemplates?: TaskTemplate[];
  timeRequirements?: {
    minMinutes?: number;
    maxMinutes?: number;
    idealMinutes?: number;
  };
}

interface UpdateRoutineInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  scheduleType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduleConfig?: {
    days?: number[];
    dates?: number[];
    time?: string;
    interval?: number;
    unit?: 'days' | 'weeks' | 'months';
  };
  hideTasksOnDashboard?: boolean;
  timeRequirements?: {
    minMinutes?: number;
    maxMinutes?: number;
    idealMinutes?: number;
  };
}

interface TaskTemplate {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
  isOptional?: boolean;
}

interface RoutineAnalytics {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  averageCompletionTime?: number;
  lastCompleted?: Date;
  streakStatus: 'active' | 'at_risk' | 'broken';
}

export class RoutineRepository {
  // CRUD Operations
  async createRoutine(data: CreateRoutineInput): Promise<Routine> {
    const database = await getDatabase();
    const routinesCollection = database.get('routines');
    
    return await database.write(async () => {
      const routine = await routinesCollection.create((routine: any) => {
        routine.name = data.name;
        routine.description = data.description || '';
        routine.icon = data.icon || '🔄';
        routine.color = data.color || '#7C3AED';
        routine.scheduleType = data.scheduleType;
        routine.scheduleConfig = data.scheduleConfig || {};
        routine.hideTasksOnDashboard = data.hideTasksOnDashboard || false;
        routine.currentStreak = 0;
        routine.longestStreak = 0;
        routine.totalCompletions = 0;
        routine.animationMode = 'standard';
        routine.userId = data.userId;
        routine.taskDependencies = [];
        routine.timeRequirements = data.timeRequirements || {};
        
        // Sync metadata
        routine.version = 1;
        routine.syncStatus = 'pending';
      });

      // Add to sync queue
      await this.addToSyncQueue('create', routine);

      // Create task templates if provided
      if (data.taskTemplates && data.taskTemplates.length > 0) {
        await this.saveTaskTemplates(routine.id, data.taskTemplates);
      }

      return routine as Routine;
    });
  }

  async updateRoutine(id: string, data: UpdateRoutineInput): Promise<Routine> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error('Routine not found');
    }

    const database = await getDatabase();
    return await database.write(async () => {
      await routine.update((r: any) => {
        if (data.name !== undefined) r.name = data.name;
        if (data.description !== undefined) r.description = data.description;
        if (data.icon !== undefined) r.icon = data.icon;
        if (data.color !== undefined) r.color = data.color;
        if (data.scheduleType !== undefined) r.scheduleType = data.scheduleType;
        if (data.scheduleConfig !== undefined) r.scheduleConfig = data.scheduleConfig;
        if (data.hideTasksOnDashboard !== undefined) r.hideTasksOnDashboard = data.hideTasksOnDashboard;
        if (data.timeRequirements !== undefined) r.timeRequirements = data.timeRequirements;
        
        // Update sync metadata
        r.version += 1;
        r.syncStatus = 'pending';
      });

      // Add to sync queue
      await this.addToSyncQueue('update', routine);

      return routine;
    });
  }

  async deleteRoutine(id: string): Promise<void> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error('Routine not found');
    }

    const database = await getDatabase();
    await database.write(async () => {
      // Delete all associated tasks first
      const tasksCollection = database.get('tasks');
      const associatedTasks = await tasksCollection.query(
        Q.where('routine_id', id)
      ).fetch();

      await Promise.all(associatedTasks.map(task => task.markAsDeleted()));

      // Add to sync queue before deletion
      await this.addToSyncQueue('delete', routine);
      
      // Delete the routine
      await routine.destroyPermanently();
    });
  }

  async getRoutineById(id: string): Promise<Routine | null> {
    try {
      const database = await getDatabase();
      const routinesCollection = database.get('routines');
      const routine = await routinesCollection.find(id);
      return routine as Routine;
    } catch (error) {
      return null;
    }
  }

  async getUserRoutines(userId: string): Promise<Routine[]> {
    const database = await getDatabase();
    const routinesCollection = database.get('routines');
    const routines = await routinesCollection.query(
      Q.where('user_id', userId),
      Q.sortBy('created_at', Q.desc)
    ).fetch();
    return routines as Routine[];
  }

  async observeUserRoutines(userId: string) {
    const database = await getDatabase();
    return database.get('routines').query(
      Q.where('user_id', userId),
      Q.sortBy('created_at', Q.desc)
    ).observe();
  }

  // Schedule & Task Generation
  async getDueRoutines(userId?: string): Promise<Routine[]> {
    const database = await getDatabase();
    const routinesCollection = database.get('routines');
    let query = routinesCollection.query();

    if (userId) {
      query = query.extend(Q.where('user_id', userId));
    }

    const routines = await query.fetch();
    
    // Filter routines that are due today
    return (routines as Routine[]).filter(routine => 
      routine.isDueToday && !routine.isCompletedToday
    );
  }

  async generateTasksFromRoutine(routineId: string): Promise<Task[]> {
    const routine = await this.getRoutineById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    // Check if routine should generate tasks today
    if (!await this.shouldGenerateTasks(routine)) {
      return [];
    }

    // Get task templates for this routine
    const taskTemplates = await this.getTaskTemplates(routineId);
    
    const database = await getDatabase();
    const createdTasks: Task[] = [];

    await database.write(async () => {
      for (const template of taskTemplates) {
        const task = await this.createRoutineTask(routine, template);
        createdTasks.push(task);
      }
    });

    return createdTasks;
  }

  async shouldGenerateTasks(routine: Routine): Promise<boolean> {
    // Check if routine is due today
    if (!routine.isDueToday) {
      return false;
    }

    // Check if tasks have already been generated today
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const existingTasks = await tasksCollection.query(
      Q.where('routine_id', routine.id),
      Q.where('created_at', Q.gte(todayTimestamp))
    ).fetch();

    return existingTasks.length === 0;
  }

  async createRoutineTask(routine: Routine, taskTemplate: TaskTemplate): Promise<Task> {
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const task = await tasksCollection.create((task: any) => {
      task.name = taskTemplate.name;
      task.description = taskTemplate.description || '';
      task.notes = '';
      task.icon = taskTemplate.icon || routine.icon;
      task.color = taskTemplate.color || routine.color;
      task.priority = taskTemplate.priority || 'medium';
      task.dueDate = today.getTime();
      task.dueTime = routine.scheduleConfig.time;
      task.isCompleted = false;
      task.progress = 0;
      task.userId = routine.userId;
      task.routineId = routine.id;
      task.tags = ['routine'];
      
      // Sync metadata
      task.deviceId = this.getDeviceId();
      task.version = 1;
      task.syncStatus = 'pending';
    });

    await this.addToSyncQueue('create', task);
    return task as Task;
  }

  // Progress & Analytics
  async markRoutineCompleted(routineId: string): Promise<Routine> {
    const routine = await this.getRoutineById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    await routine.markCompleted();
    await this.addToSyncQueue('update', routine);
    
    return routine;
  }

  async updateRoutineStreak(routineId: string): Promise<Routine> {
    const routine = await this.getRoutineById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    // The streak is automatically updated in markCompleted method
    // This method can be used for manual streak adjustments if needed
    await this.addToSyncQueue('update', routine);
    
    return routine;
  }

  async getRoutineAnalytics(routineId: string): Promise<RoutineAnalytics> {
    const routine = await this.getRoutineById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    // Calculate completion rate
    const database = await getDatabase();
    const tasksCollection = database.get('tasks');
    
    const allTasks = await tasksCollection.query(
      Q.where('routine_id', routineId)
    ).fetch();
    
    const completedTasks = allTasks.filter(task => task.isCompleted);
    const completionRate = allTasks.length > 0 
      ? (completedTasks.length / allTasks.length) * 100 
      : 0;

    return {
      totalCompletions: routine.totalCompletions,
      currentStreak: routine.currentStreak,
      longestStreak: routine.longestStreak,
      completionRate: Math.round(completionRate),
      lastCompleted: routine.lastCompleted ? new Date(routine.lastCompleted) : undefined,
      streakStatus: routine.streakStatus,
    };
  }

  async resetRoutineStreak(routineId: string): Promise<Routine> {
    const routine = await this.getRoutineById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    await routine.resetStreak();
    await this.addToSyncQueue('update', routine);
    
    return routine;
  }

  // Helper methods
  private async saveTaskTemplates(routineId: string, templates: TaskTemplate[]): Promise<void> {
    // In a real implementation, you might want to store these in a separate table
    // For now, we'll store them in the routine's taskDependencies field
    const routine = await this.getRoutineById(routineId);
    if (!routine) return;

    await routine.update((r: any) => {
      r.taskDependencies = templates.map((template, index) => ({
        taskId: uuidv4(), // Generate a unique ID for the template
        order: template.order || index,
        isOptional: template.isOptional || false,
        ...template,
      }));
      r.version += 1;
      r.syncStatus = 'pending';
    });
  }

  private async getTaskTemplates(routineId: string): Promise<TaskTemplate[]> {
    const routine = await this.getRoutineById(routineId);
    if (!routine || !routine.taskDependencies) {
      return [];
    }

    return routine.taskDependencies.map(dep => ({
      name: (dep as any).name || 'Routine Task',
      description: (dep as any).description,
      icon: (dep as any).icon,
      color: (dep as any).color,
      priority: (dep as any).priority,
      order: dep.order,
      isOptional: dep.isOptional,
    }));
  }

  // Sync & Offline Support
  private async addToSyncQueue(operation: 'create' | 'update' | 'delete', record: Routine | Task): Promise<void> {
    // This would be implemented with the sync_queue table
    // For now, we'll just log it
    console.log(`Added to sync queue: ${operation} ${record.constructor.name} ${record.id}`);
  }

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

  // Additional utility methods
  async getActiveRoutines(userId: string): Promise<Routine[]> {
    const routines = await this.getUserRoutines(userId);
    return routines.filter(routine => routine.streakStatus !== 'broken');
  }

  async getRoutinesByScheduleType(userId: string, scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom'): Promise<Routine[]> {
    const database = await getDatabase();
    const routinesCollection = database.get('routines');
    const routines = await routinesCollection.query(
      Q.where('user_id', userId),
      Q.where('schedule_type', scheduleType),
      Q.sortBy('created_at', Q.desc)
    ).fetch();
    return routines as Routine[];
  }

  async batchGenerateTasksForDueRoutines(userId: string): Promise<Task[]> {
    const dueRoutines = await this.getDueRoutines(userId);
    const allTasks: Task[] = [];

    for (const routine of dueRoutines) {
      const tasks = await this.generateTasksFromRoutine(routine.id);
      allTasks.push(...tasks);
    }

    return allTasks;
  }
}

// Export singleton instance
export const routineRepository = new RoutineRepository();
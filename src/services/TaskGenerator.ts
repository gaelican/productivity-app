import { getDatabase } from './database';
import { taskRepository } from './database/repositories/TaskRepository';
import Routine from './database/models/Routine';
import { Q } from '@nozbe/watermelondb';
import { ParsedTask } from '../core/tasks/parser';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

export interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  estimatedDuration: number;
  order: number;
  dependsOn?: string[];
}

export interface GeneratedTaskResult {
  tasksCreated: number;
  errors: string[];
  taskIds: string[];
}

export class TaskGenerator {
  /**
   * Generate tasks from a routine
   */
  async generateTasksFromRoutine(routine: Routine): Promise<GeneratedTaskResult> {
    const result: GeneratedTaskResult = {
      tasksCreated: 0,
      errors: [],
      taskIds: [],
    };

    try {
      // Parse task templates from taskDependencies (where they're currently stored)
      const taskTemplates = this.parseTaskTemplatesFromDependencies(routine.taskDependencies);
      
      if (taskTemplates.length === 0) {
        result.errors.push('No task templates found in routine');
        return result;
      }

      // Get current date for task creation
      const now = new Date();
      const baseTime = this.getRoutineStartTime(routine, now);

      // Sort templates by dependencies to ensure proper order
      const sortedTemplates = this.sortTemplatesByDependencies(taskTemplates);
      
      // Map to store created task IDs by template ID
      const createdTaskMap = new Map<string, string>();
      
      // Create tasks from templates
      let currentTime = new Date(baseTime);
      
      for (const template of sortedTemplates) {
        try {
          // Check if all dependencies have been created
          const dependencyTaskIds: string[] = [];
          if (template.dependsOn && template.dependsOn.length > 0) {
            for (const depId of template.dependsOn) {
              const depTaskId = createdTaskMap.get(depId);
              if (!depTaskId) {
                // Skip this task if dependency hasn't been created
                result.errors.push(`Skipping ${template.name}: dependency not created`);
                continue;
              }
              dependencyTaskIds.push(depTaskId);
            }
          }
          
          // Calculate start time based on dependencies
          if (dependencyTaskIds.length > 0) {
            // Get the latest end time from dependencies
            const latestEndTime = await this.getLatestDependencyEndTime(dependencyTaskIds);
            if (latestEndTime > currentTime) {
              currentTime = new Date(latestEndTime);
            }
          }
          
          // Create task from template
          const task = await taskRepository.create({
            name: template.name,
            icon: template.icon,
            color: routine.color,
            priority: 'medium',
            userId: routine.userId,
            tags: [`routine:${routine.id}`, routine.name],
            parsedInput: `${template.name} (from ${routine.name})`,
            dueDate: currentTime.getTime(),
            dueTime: this.formatTime(currentTime),
            linkedRoutineId: routine.id,
            estimatedDuration: template.estimatedDuration,
            dependencyTaskIds,
          });

          result.taskIds.push(task.id);
          result.tasksCreated++;
          createdTaskMap.set(template.id, task.id);

          // Add estimated duration to current time for next task
          currentTime = new Date(currentTime.getTime() + template.estimatedDuration * 60 * 1000);
        } catch (error) {
          console.error('Error creating task from template:', template, error);
          result.errors.push(`Failed to create task: ${template.name}`);
        }
      }

      // Update routine with last generated date
      // Note: We need to add lastGeneratedAt field to the routine model
      // For now, we'll track this in a separate way

    } catch (error) {
      console.error('Error generating tasks from routine:', error);
      result.errors.push('Failed to generate tasks from routine');
    }

    return result;
  }

  /**
   * Generate tasks for all active routines that are due
   */
  async generateDueRoutineTasks(): Promise<{ [routineId: string]: GeneratedTaskResult }> {
    const results: { [routineId: string]: GeneratedTaskResult } = {};

    try {
      const database = await getDatabase();
      const routinesCollection = database.get<Routine>('routines');
      
      // Get all active routines
      const activeRoutines = await routinesCollection
        .query(
          Q.where('user_id', DEFAULT_USER_ID),
          Q.where('is_active', true)
        )
        .fetch();

      // Check each routine if it's due for task generation
      for (const routine of activeRoutines) {
        if (await this.isRoutineDue(routine)) {
          const result = await this.generateTasksFromRoutine(routine);
          results[routine.id] = result;
        }
      }
    } catch (error) {
      console.error('Error generating due routine tasks:', error);
    }

    return results;
  }

  /**
   * Check if a routine is due for task generation
   */
  private async isRoutineDue(routine: Routine): Promise<boolean> {
    const schedule = routine.scheduleConfig;
    if (!schedule) return false;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
    const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 (Monday-Sunday)

    // Check if today is a scheduled day
    if (!schedule.days.includes(mappedDay)) {
      return false;
    }

    // Check if tasks have already been generated today
    // TODO: Add lastGeneratedAt to routine model
    // For now, we'll check if tasks exist for today
    const todaysTasks = await this.checkTodaysTasksForRoutine(routine.id);
    if (todaysTasks) {
      return false; // Already generated today
    }

    // Check if current time is past the preferred time
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const preferredTime = new Date(now);
      preferredTime.setHours(hours, minutes, 0, 0);
      
      return now >= preferredTime;
    }

    return true;
  }

  /**
   * Parse task templates from taskDependencies array
   */
  private parseTaskTemplatesFromDependencies(dependencies: any[]): TaskTemplate[] {
    if (!dependencies || !Array.isArray(dependencies)) return [];

    return dependencies
      .map(dep => ({
        id: dep.id || dep.taskId || Date.now().toString(),
        name: dep.name || 'Routine Task',
        icon: dep.icon || '📌',
        estimatedDuration: dep.estimatedDuration || 5,
        order: dep.order || 0,
        dependsOn: dep.dependsOn || [],
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Check if tasks already exist for today
   */
  private async checkTodaysTasksForRoutine(routineId: string): Promise<boolean> {
    try {
      const database = await getDatabase();
      const tasksCollection = database.get<any>('tasks');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysTasks = await tasksCollection
        .query(
          Q.where('routine_id', routineId),
          Q.where('due_date', Q.gte(today.getTime())),
          Q.where('due_date', Q.lt(tomorrow.getTime()))
        )
        .fetch();
      
      return todaysTasks.length > 0;
    } catch (error) {
      console.error('Error checking today\'s tasks:', error);
      return false;
    }
  }

  /**
   * Get routine start time based on schedule
   */
  private getRoutineStartTime(routine: Routine, baseDate: Date): Date {
    const schedule = routine.scheduleConfig;
    const startTime = new Date(baseDate);

    if (schedule?.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
    } else {
      // Default to current time if no preferred time
      startTime.setSeconds(0, 0);
    }

    return startTime;
  }

  /**
   * Format time as HH:MM string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Update routine's last generated timestamp
   * TODO: Add lastGeneratedAt field to routine model
   */
  private async updateRoutineLastGenerated(routine: Routine): Promise<void> {
    try {
      const database = await getDatabase();
      await database.write(async () => {
        await routine.update((r) => {
          // For now, we'll update the version to trigger sync
          r.version += 1;
          r.syncStatus = 'pending';
        });
      });
    } catch (error) {
      console.error('Error updating routine:', error);
    }
  }

  /**
   * Generate recurring tasks based on frequency
   */
  async generateRecurringTasks(
    baseTask: {
      name: string;
      icon: string;
      color: string;
      priority: 'low' | 'medium' | 'high';
      tags?: string[];
    },
    frequency: 'daily' | 'weekly' | 'monthly',
    count: number = 7
  ): Promise<GeneratedTaskResult> {
    const result: GeneratedTaskResult = {
      tasksCreated: 0,
      errors: [],
      taskIds: [],
    };

    try {
      const now = new Date();
      let currentDate = new Date(now);

      for (let i = 0; i < count; i++) {
        // Calculate due date based on frequency
        switch (frequency) {
          case 'daily':
            currentDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            currentDate = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            currentDate = new Date(now);
            currentDate.setMonth(currentDate.getMonth() + i);
            break;
        }

        try {
          const task = await taskRepository.create({
            ...baseTask,
            name: `${baseTask.name} - ${this.formatDate(currentDate)}`,
            userId: DEFAULT_USER_ID,
            dueDate: currentDate.getTime(),
            tags: [...(baseTask.tags || []), `recurring:${frequency}`],
            parsedInput: `${baseTask.name} (recurring ${frequency})`,
          });

          result.taskIds.push(task.id);
          result.tasksCreated++;
        } catch (error) {
          console.error('Error creating recurring task:', error);
          result.errors.push(`Failed to create task for ${this.formatDate(currentDate)}`);
        }
      }
    } catch (error) {
      console.error('Error generating recurring tasks:', error);
      result.errors.push('Failed to generate recurring tasks');
    }

    return result;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Sort templates by dependencies using topological sort
   */
  private sortTemplatesByDependencies(templates: TaskTemplate[]): TaskTemplate[] {
    const sorted: TaskTemplate[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (template: TaskTemplate) => {
      if (visited.has(template.id)) return;
      if (visiting.has(template.id)) {
        // Circular dependency detected, skip
        console.warn(`Circular dependency detected for task: ${template.name}`);
        return;
      }
      
      visiting.add(template.id);
      
      // Visit dependencies first
      if (template.dependsOn) {
        for (const depId of template.dependsOn) {
          const dep = templates.find(t => t.id === depId);
          if (dep) visit(dep);
        }
      }
      
      visiting.delete(template.id);
      visited.add(template.id);
      sorted.push(template);
    };
    
    // Visit all templates
    for (const template of templates) {
      visit(template);
    }
    
    return sorted;
  }

  /**
   * Get the latest end time from dependency tasks
   */
  private async getLatestDependencyEndTime(taskIds: string[]): Promise<number> {
    try {
      const database = await getDatabase();
      const tasksCollection = database.get<any>('tasks');
      
      let latestEndTime = 0;
      
      for (const taskId of taskIds) {
        const task = await tasksCollection.find(taskId);
        if (task && task.dueDate) {
          const taskEndTime = task.dueDate + (task.estimatedDuration || 0) * 60 * 1000;
          if (taskEndTime > latestEndTime) {
            latestEndTime = taskEndTime;
          }
        }
      }
      
      return latestEndTime;
    } catch (error) {
      console.error('Error getting dependency end times:', error);
      return Date.now();
    }
  }
}

// Export singleton instance
export const taskGenerator = new TaskGenerator();
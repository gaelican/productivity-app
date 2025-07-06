import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import Task from '../database/models/Task';
import { WidgetModule } from '../../modules/WidgetModule';

interface WidgetTask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  priority?: string;
}

class WidgetSyncService {
  private database: Database;
  private subscription?: () => void;
  private updateDebounceTimer?: NodeJS.Timeout;

  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Start observing database changes and sync to widgets
   */
  start(): void {
    if (Platform.OS !== 'android') {
      console.log('Widget sync is only available on Android');
      return;
    }

    try {
      // Set up observer for task collection
      const tasksCollection = this.database.get<Task>('tasks');
      
      // Observe all tasks and sync on changes
      const observable = tasksCollection.query().observeWithColumns(['name', 'is_completed', 'due_date', 'priority']);
      
      this.subscription = observable.subscribe({
        next: (tasks) => {
          this.debouncedUpdateWidgets(tasks);
        },
        error: (error) => {
          console.error('Error observing tasks for widget sync:', error);
        }
      });

      // Initial sync
      this.syncTasksToWidget();
    } catch (error) {
      console.error('Failed to start widget sync service:', error);
    }
  }

  /**
   * Stop observing database changes
   */
  stop(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = undefined;
    }

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = undefined;
    }
  }

  /**
   * Debounce widget updates to avoid excessive updates
   */
  private debouncedUpdateWidgets(tasks: Task[]): void {
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = setTimeout(() => {
      this.updateWidgetsWithTasks(tasks);
    }, 300); // 300ms debounce
  }

  /**
   * Sync current tasks to widget
   */
  private async syncTasksToWidget(): Promise<void> {
    try {
      const tasksCollection = this.database.get<Task>('tasks');
      const tasks = await tasksCollection.query().fetch();
      await this.updateWidgetsWithTasks(tasks);
    } catch (error) {
      console.error('Failed to sync tasks to widget:', error);
    }
  }

  /**
   * Update widget with tasks
   */
  private async updateWidgetsWithTasks(tasks: Task[]): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      // Convert tasks to widget format
      const widgetTasks: WidgetTask[] = tasks
        .filter(task => !task.isCompleted) // Only show incomplete tasks
        .slice(0, 10) // Limit to 10 tasks for widget performance
        .map(task => ({
          id: task.id,
          title: task.name,
          isCompleted: task.isCompleted,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          priority: task.priority
        }));

      // Update widget via native module
      await WidgetModule.updateTaskList(widgetTasks);
    } catch (error) {
      console.error('Failed to update widget tasks:', error);
    }
  }

  /**
   * Handle task completion from widget
   */
  async handleWidgetTaskCompletion(taskId: string): Promise<void> {
    try {
      const tasksCollection = this.database.get<Task>('tasks');
      const task = await tasksCollection.find(taskId);
      
      await this.database.write(async () => {
        await task.update((t) => {
          t.isCompleted = true;
        });
      });

      console.log(`Task ${taskId} marked as completed from widget`);
    } catch (error) {
      console.error('Failed to complete task from widget:', error);
    }
  }

  /**
   * Handle widget refresh request
   */
  async handleWidgetRefresh(): Promise<void> {
    await this.syncTasksToWidget();
  }
}

// Singleton instance
let widgetSyncServiceInstance: WidgetSyncService | null = null;

/**
 * Get or create widget sync service instance
 */
export function getWidgetSyncService(database: Database): WidgetSyncService {
  if (!widgetSyncServiceInstance) {
    widgetSyncServiceInstance = new WidgetSyncService(database);
  }
  return widgetSyncServiceInstance;
}

/**
 * Clean up widget sync service
 */
export function cleanupWidgetSyncService(): void {
  if (widgetSyncServiceInstance) {
    widgetSyncServiceInstance.stop();
    widgetSyncServiceInstance = null;
  }
}
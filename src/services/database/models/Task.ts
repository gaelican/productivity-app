import { Model } from '@nozbe/watermelondb';
import { field, date, json, readonly, writer, lazy, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { sanitizeJson } from '../schema';

export default class Task extends Model {
  static table = 'tasks';
  
  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
    goals: { type: 'belongs_to', key: 'goal_id' },
    routines: { type: 'belongs_to', key: 'routine_id' },
    tasks: { type: 'belongs_to', key: 'parent_task_id' },
  };

  @field('name') name!: string;
  @field('description') description?: string;
  @field('notes') notes?: string;
  @field('icon') icon!: string;
  @field('color') color!: string;
  @field('priority') priority!: 'low' | 'medium' | 'high' | 'urgent';
  @field('due_date') dueDate?: number;
  @field('due_time') dueTime?: string;
  @field('is_completed') isCompleted!: boolean;
  @field('completed_at') completedAt?: number;
  @field('progress') progress!: number;
  @field('parsed_input') parsedInput?: string;
  
  // Relations
  @field('user_id') userId!: string;
  @field('goal_id') goalId?: string;
  @field('routine_id') routineId?: string;
  @field('parent_task_id') parentTaskId?: string;
  
  // Sync metadata
  @field('device_id') deviceId!: string;
  @field('version') version!: number;
  @field('sync_status') syncStatus!: 'pending' | 'synced' | 'conflict';
  @field('last_synced_at') lastSyncedAt?: number;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  
  // JSON fields
  @json('tags', sanitizeJson) tags!: string[];
  
  // Relations
  @relation('users', 'user_id') user: any;
  @lazy goal = this.collections.get('goals').findAndObserve(this.goalId || '');
  @lazy routine = this.collections.get('routines').findAndObserve(this.routineId || '');
  @lazy parentTask = this.collections.get('tasks').findAndObserve(this.parentTaskId || '');
  
  // Methods
  @writer async complete() {
    await this.update((task) => {
      task.isCompleted = true;
      task.completedAt = Date.now();
      task.progress = 100;
      task.version += 1;
      task.syncStatus = 'pending';
    });
    
    // Update linked goal progress if exists
    if (this.goalId) {
      try {
        const goal = await this.collections.get('goals').find(this.goalId);
        if (goal && !goal.isCompleted) {
          // For habit goals, increment by 1
          // For numeric goals, use the task's estimated value or default increment
          const increment = goal.goalType === 'habit' ? 1 : (goal.defaultIncrement || 1);
          await goal.addQuickIncrement(increment);
        }
      } catch (error) {
        console.error('Error updating goal progress:', error);
      }
    }
  }
  
  @writer async uncomplete() {
    await this.update((task) => {
      task.isCompleted = false;
      task.completedAt = undefined;
      task.progress = 0;
      task.version += 1;
      task.syncStatus = 'pending';
    });
  }
  
  @writer async updateProgress(progress: number) {
    await this.update((task) => {
      task.progress = Math.max(0, Math.min(100, progress));
      if (task.progress === 100) {
        task.isCompleted = true;
        task.completedAt = Date.now();
      } else if (task.isCompleted && task.progress < 100) {
        task.isCompleted = false;
        task.completedAt = undefined;
      }
      task.version += 1;
      task.syncStatus = 'pending';
    });
  }
  
  @writer async addTag(tag: string) {
    await this.update((task) => {
      const currentTags = [...task.tags];
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        task.tags = currentTags;
        task.version += 1;
        task.syncStatus = 'pending';
      }
    });
  }
  
  @writer async removeTag(tag: string) {
    await this.update((task) => {
      task.tags = task.tags.filter(t => t !== tag);
      task.version += 1;
      task.syncStatus = 'pending';
    });
  }
  
  get isDue(): boolean {
    if (!this.dueDate) return false;
    return this.dueDate < Date.now();
  }
  
  get isOverdue(): boolean {
    if (!this.dueDate || this.isCompleted) return false;
    return this.dueDate < Date.now();
  }
  
  get daysUntilDue(): number | null {
    if (!this.dueDate) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((this.dueDate - Date.now()) / msPerDay);
  }
  
  get formattedDueDate(): string | null {
    if (!this.dueDate) return null;
    const date = new Date(this.dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  }
  
  @writer async markAsDeleted() {
    // In a real sync implementation, we might just mark as deleted
    // For now, we'll actually delete the record
    await this.destroyPermanently();
  }
}
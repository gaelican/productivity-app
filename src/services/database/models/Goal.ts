import { Model, Q } from '@nozbe/watermelondb';
import { field, date, json, readonly, writer, lazy, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { sanitizeJson } from '../schema';

interface ProgressHistoryEntry {
  date: number;
  value: number;
  increment: number;
  note?: string;
}

interface QuickIncrement {
  label: string;
  value: number;
  icon?: string;
}

export default class Goal extends Model {
  static table = 'goals';
  
  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
    tasks: { type: 'has_many', foreignKey: 'goal_id' },
  };

  @field('name') name!: string;
  @field('description') description?: string;
  @field('category') category!: string;
  @field('icon') icon!: string;
  @field('color') color!: string;
  
  // Progress tracking
  @field('current_value') currentValue!: number;
  @field('target_value') targetValue!: number;
  @field('unit') unit!: string;
  @field('progress_percentage') progressPercentage!: number;
  
  // Interaction settings
  @field('default_tap_action') defaultTapAction!: string;
  @field('default_increment') defaultIncrement!: number;
  @field('celebration_mode') celebrationMode!: 'basic' | 'standard' | 'premium';
  
  // Status
  @field('status') status!: 'active' | 'paused' | 'completed' | 'archived';
  @field('priority') priority!: 'low' | 'medium' | 'high';
  @field('target_date') targetDate?: number;
  @field('completed_at') completedAt?: number;
  
  // Relations
  @field('user_id') userId!: string;
  
  // Sync metadata
  @field('version') version!: number;
  @field('sync_status') syncStatus!: 'pending' | 'synced' | 'conflict';
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  
  // JSON fields
  @json('quick_increments', sanitizeJson) quickIncrements!: QuickIncrement[];
  @json('progress_history', sanitizeJson) progressHistory!: ProgressHistoryEntry[];
  
  // Relations
  @children('tasks') tasks!: any;
  
  // Methods
  @writer async updateProgress(increment: number, note?: string) {
    const newValue = Math.max(0, Math.min(this.targetValue, this.currentValue + increment));
    const newPercentage = Math.round((newValue / this.targetValue) * 100);
    
    await this.update((goal) => {
      goal.currentValue = newValue;
      goal.progressPercentage = newPercentage;
      
      // Update progress history
      const history = [...goal.progressHistory];
      history.push({
        date: Date.now(),
        value: newValue,
        increment,
        note
      });
      
      // Keep only last 100 entries for performance
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      goal.progressHistory = history;
      
      // Check if goal completed
      if (newValue >= goal.targetValue && goal.status === 'active') {
        goal.status = 'completed';
        goal.completedAt = Date.now();
      }
      
      goal.version += 1;
      goal.syncStatus = 'pending';
    });
  }
  
  @writer async setProgress(value: number, note?: string) {
    const newValue = Math.max(0, Math.min(this.targetValue, value));
    const increment = newValue - this.currentValue;
    await this.updateProgress(increment, note);
  }
  
  @writer async addQuickIncrement(label: string, value: number, icon?: string) {
    await this.update((goal) => {
      const increments = [...goal.quickIncrements];
      increments.push({ label, value, icon });
      goal.quickIncrements = increments;
      goal.version += 1;
      goal.syncStatus = 'pending';
    });
  }
  
  @writer async removeQuickIncrement(label: string) {
    await this.update((goal) => {
      goal.quickIncrements = goal.quickIncrements.filter(inc => inc.label !== label);
      goal.version += 1;
      goal.syncStatus = 'pending';
    });
  }
  
  @writer async changeStatus(newStatus: 'active' | 'paused' | 'completed' | 'archived') {
    await this.update((goal) => {
      goal.status = newStatus;
      if (newStatus === 'completed' && !goal.completedAt) {
        goal.completedAt = Date.now();
      }
      goal.version += 1;
      goal.syncStatus = 'pending';
    });
  }
  
  @writer async reset() {
    await this.update((goal) => {
      goal.currentValue = 0;
      goal.progressPercentage = 0;
      goal.status = 'active';
      goal.completedAt = undefined;
      goal.progressHistory = [];
      goal.version += 1;
      goal.syncStatus = 'pending';
    });
  }
  
  // Getters
  get remainingValue(): number {
    return Math.max(0, this.targetValue - this.currentValue);
  }
  
  get isCompleted(): boolean {
    return this.status === 'completed';
  }
  
  get isActive(): boolean {
    return this.status === 'active';
  }
  
  get daysUntilTarget(): number | null {
    if (!this.targetDate) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((this.targetDate - Date.now()) / msPerDay);
  }
  
  get isOverdue(): boolean {
    if (!this.targetDate || this.isCompleted) return false;
    return this.targetDate < Date.now();
  }
  
  get averageDailyProgress(): number {
    if (this.progressHistory.length === 0) return 0;
    
    // Get the date range
    const firstEntry = this.progressHistory[0];
    const lastEntry = this.progressHistory[this.progressHistory.length - 1];
    const daysDiff = Math.max(1, Math.floor((lastEntry.date - firstEntry.date) / (1000 * 60 * 60 * 24)));
    
    // Calculate total progress
    const totalProgress = this.progressHistory.reduce((sum, entry) => sum + Math.max(0, entry.increment), 0);
    
    return totalProgress / daysDiff;
  }
  
  get projectedCompletionDate(): number | null {
    const avgProgress = this.averageDailyProgress;
    if (avgProgress <= 0) return null;
    
    const remainingDays = Math.ceil(this.remainingValue / avgProgress);
    return Date.now() + (remainingDays * 24 * 60 * 60 * 1000);
  }
  
  get recentProgress(): ProgressHistoryEntry[] {
    // Return last 7 days of progress
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return this.progressHistory.filter(entry => entry.date >= sevenDaysAgo);
  }
  
  async getRelatedTasks() {
    return await this.tasks.extend(
      Q.sortBy('created_at', Q.desc)
    ).fetch();
  }
  
  async getActiveRelatedTasks() {
    return await this.tasks.extend(
      Q.where('is_completed', false),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('due_date', Q.asc)
    ).fetch();
  }
}
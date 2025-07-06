import { Model, Q } from '@nozbe/watermelondb';
import { field, date, json, readonly, writer, lazy, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { sanitizeJson } from '../schema';

interface ScheduleConfig {
  days?: number[]; // For weekly: 0-6 (Sun-Sat)
  dates?: number[]; // For monthly: 1-31
  time?: string; // HH:MM format
  interval?: number; // For custom intervals
  unit?: 'days' | 'weeks' | 'months';
}

interface TaskDependency {
  taskId: string;
  order: number;
  isOptional?: boolean;
}

interface TimeRequirement {
  minMinutes?: number;
  maxMinutes?: number;
  idealMinutes?: number;
}

export default class Routine extends Model {
  static table = 'routines';
  
  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
    tasks: { type: 'has_many', foreignKey: 'routine_id' },
  };

  @field('name') name!: string;
  @field('description') description?: string;
  @field('icon') icon!: string;
  @field('color') color!: string;
  
  // Schedule
  @field('schedule_type') scheduleType!: 'daily' | 'weekly' | 'monthly' | 'custom';
  @field('hide_tasks_on_dashboard') hideTasksOnDashboard!: boolean;
  
  // Tracking
  @field('current_streak') currentStreak!: number;
  @field('longest_streak') longestStreak!: number;
  @field('total_completions') totalCompletions!: number;
  @field('last_completed') lastCompleted?: number;
  
  // Performance
  @field('animation_mode') animationMode!: 'basic' | 'standard' | 'premium';
  
  // Relations
  @field('user_id') userId!: string;
  
  // Sync metadata
  @field('version') version!: number;
  @field('sync_status') syncStatus!: 'pending' | 'synced' | 'conflict';
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  
  // JSON fields
  @json('schedule_config', sanitizeJson) scheduleConfig!: ScheduleConfig;
  @json('task_dependencies', sanitizeJson) taskDependencies!: TaskDependency[];
  @json('time_requirements', sanitizeJson) timeRequirements!: TimeRequirement;
  
  // Relations
  @children('tasks') tasks!: any;
  
  // Methods
  @writer async markCompleted() {
    const now = Date.now();
    const lastDate = this.lastCompleted ? new Date(this.lastCompleted) : null;
    const today = new Date(now);
    
    // Check if already completed today
    if (lastDate && 
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear()) {
      return; // Already completed today
    }
    
    // Update streak
    let newStreak = 1;
    if (lastDate) {
      const daysSinceLastCompletion = Math.floor((now - this.lastCompleted!) / (1000 * 60 * 60 * 24));
      if (daysSinceLastCompletion === 1) {
        newStreak = this.currentStreak + 1;
      }
    }
    
    await this.update((routine) => {
      routine.lastCompleted = now;
      routine.currentStreak = newStreak;
      routine.longestStreak = Math.max(routine.longestStreak, newStreak);
      routine.totalCompletions += 1;
      routine.version += 1;
      routine.syncStatus = 'pending';
    });
  }
  
  @writer async resetStreak() {
    await this.update((routine) => {
      routine.currentStreak = 0;
      routine.version += 1;
      routine.syncStatus = 'pending';
    });
  }
  
  @writer async updateSchedule(scheduleType: string, config: ScheduleConfig) {
    await this.update((routine) => {
      routine.scheduleType = scheduleType as any;
      routine.scheduleConfig = config;
      routine.version += 1;
      routine.syncStatus = 'pending';
    });
  }
  
  get isCompletedToday(): boolean {
    if (!this.lastCompleted) return false;
    
    const lastDate = new Date(this.lastCompleted);
    const today = new Date();
    
    return lastDate.getDate() === today.getDate() &&
           lastDate.getMonth() === today.getMonth() &&
           lastDate.getFullYear() === today.getFullYear();
  }
  
  get isDueToday(): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();
    
    switch (this.scheduleType) {
      case 'daily':
        return true;
        
      case 'weekly':
        return this.scheduleConfig.days?.includes(dayOfWeek) || false;
        
      case 'monthly':
        return this.scheduleConfig.dates?.includes(dateOfMonth) || false;
        
      case 'custom':
        if (!this.lastCompleted) return true;
        const daysSinceLastCompletion = Math.floor(
          (Date.now() - this.lastCompleted) / (1000 * 60 * 60 * 24)
        );
        const interval = this.scheduleConfig.interval || 1;
        const unit = this.scheduleConfig.unit || 'days';
        
        switch (unit) {
          case 'days':
            return daysSinceLastCompletion >= interval;
          case 'weeks':
            return daysSinceLastCompletion >= interval * 7;
          case 'months':
            return daysSinceLastCompletion >= interval * 30;
          default:
            return false;
        }
        
      default:
        return false;
    }
  }
  
  get streakStatus(): 'active' | 'at_risk' | 'broken' {
    if (!this.lastCompleted) return 'broken';
    
    const daysSinceLastCompletion = Math.floor(
      (Date.now() - this.lastCompleted) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastCompletion === 0) return 'active';
    if (daysSinceLastCompletion === 1) return 'at_risk';
    return 'broken';
  }
  
  async getIncompleteTasks() {
    return await this.tasks.extend(
      Q.where('is_completed', false),
      Q.sortBy('created_at', Q.asc)
    ).fetch();
  }
}
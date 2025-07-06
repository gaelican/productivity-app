import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import Goal from '../models/Goal';

interface CreateGoalInput {
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  targetValue: number;
  unit: string;
  defaultIncrement: number;
  userId: string;
  quickIncrements?: Array<{ label: string; value: number; icon?: string }>;
  targetDate?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface UpdateGoalInput {
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  targetValue?: number;
  unit?: string;
  defaultIncrement?: number;
  targetDate?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'paused' | 'completed' | 'archived';
}

class GoalRepository {
  private get goalsCollection() {
    return database.get<Goal>('goals');
  }

  // Create a new goal
  async createGoal(input: CreateGoalInput): Promise<Goal> {
    return await database.write(async () => {
      const goal = await this.goalsCollection.create((goal) => {
        goal.name = input.name;
        goal.description = input.description;
        goal.category = input.category;
        goal.icon = input.icon;
        goal.color = input.color;
        goal.currentValue = 0;
        goal.targetValue = input.targetValue;
        goal.unit = input.unit;
        goal.progressPercentage = 0;
        goal.defaultTapAction = 'increment';
        goal.defaultIncrement = input.defaultIncrement;
        goal.celebrationMode = 'standard';
        goal.status = 'active';
        goal.priority = input.priority || 'medium';
        goal.targetDate = input.targetDate;
        goal.userId = input.userId;
        goal.version = 1;
        goal.syncStatus = 'pending';
        goal.quickIncrements = input.quickIncrements || [];
        goal.progressHistory = [];
      });
      
      console.log('[GoalRepository] Created goal:', goal.name);
      return goal;
    });
  }

  // Get all goals for a user
  async getUserGoals(userId: string): Promise<Goal[]> {
    return await this.goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  }

  // Get active goals for a user
  async getActiveGoals(userId: string): Promise<Goal[]> {
    return await this.goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'active'),
        Q.sortBy('priority', Q.desc),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  }

  // Get completed goals for a user
  async getCompletedGoals(userId: string, limit?: number): Promise<Goal[]> {
    let query = this.goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'completed'),
        Q.sortBy('completed_at', Q.desc)
      );
    
    if (limit) {
      query = query.extend(Q.take(limit));
    }
    
    return await query.fetch();
  }

  // Get goals by category
  async getGoalsByCategory(userId: string, category: string): Promise<Goal[]> {
    return await this.goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('category', category),
        Q.sortBy('priority', Q.desc)
      )
      .fetch();
  }

  // Get goal by ID
  async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      return await this.goalsCollection.find(goalId);
    } catch (error) {
      console.error('[GoalRepository] Goal not found:', goalId);
      return null;
    }
  }

  // Update goal
  async updateGoal(goalId: string, input: UpdateGoalInput): Promise<Goal | null> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return null;

    return await database.write(async () => {
      await goal.update((g) => {
        if (input.name !== undefined) g.name = input.name;
        if (input.description !== undefined) g.description = input.description;
        if (input.category !== undefined) g.category = input.category;
        if (input.icon !== undefined) g.icon = input.icon;
        if (input.color !== undefined) g.color = input.color;
        if (input.targetValue !== undefined) {
          g.targetValue = input.targetValue;
          // Recalculate progress percentage
          g.progressPercentage = Math.round((g.currentValue / input.targetValue) * 100);
        }
        if (input.unit !== undefined) g.unit = input.unit;
        if (input.defaultIncrement !== undefined) g.defaultIncrement = input.defaultIncrement;
        if (input.targetDate !== undefined) g.targetDate = input.targetDate;
        if (input.priority !== undefined) g.priority = input.priority;
        if (input.status !== undefined) g.status = input.status;
        
        g.version += 1;
        g.syncStatus = 'pending';
      });
      
      console.log('[GoalRepository] Updated goal:', goal.name);
      return goal;
    });
  }

  // Delete goal
  async deleteGoal(goalId: string): Promise<boolean> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return false;

    await database.write(async () => {
      // First, unlink any related tasks
      const relatedTasks = await goal.getRelatedTasks();
      for (const task of relatedTasks) {
        await task.update((t: any) => {
          t.goalId = null;
          t.version += 1;
          t.syncStatus = 'pending';
        });
      }
      
      // Then delete the goal
      await goal.markAsDeleted();
    });
    
    console.log('[GoalRepository] Deleted goal:', goal.name);
    return true;
  }

  // Update goal progress
  async incrementGoalProgress(goalId: string, increment: number, note?: string): Promise<Goal | null> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return null;

    await goal.updateProgress(increment, note);
    console.log('[GoalRepository] Updated progress for goal:', goal.name, 'New value:', goal.currentValue);
    return goal;
  }

  // Set absolute progress
  async setGoalProgress(goalId: string, value: number, note?: string): Promise<Goal | null> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return null;

    await goal.setProgress(value, note);
    console.log('[GoalRepository] Set progress for goal:', goal.name, 'Value:', value);
    return goal;
  }

  // Add quick increment option
  async addQuickIncrement(goalId: string, label: string, value: number, icon?: string): Promise<Goal | null> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return null;

    await goal.addQuickIncrement(label, value, icon);
    console.log('[GoalRepository] Added quick increment to goal:', goal.name);
    return goal;
  }

  // Get goals with upcoming deadlines
  async getUpcomingDeadlineGoals(userId: string, daysAhead: number = 7): Promise<Goal[]> {
    const deadline = Date.now() + (daysAhead * 24 * 60 * 60 * 1000);
    
    return await this.goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'active'),
        Q.where('target_date', Q.notEq(null)),
        Q.where('target_date', Q.lte(deadline)),
        Q.sortBy('target_date', Q.asc)
      )
      .fetch();
  }

  // Get overdue goals
  async getOverdueGoals(userId: string): Promise<Goal[]> {
    const now = Date.now();
    
    return await this.goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'active'),
        Q.where('target_date', Q.notEq(null)),
        Q.where('target_date', Q.lt(now)),
        Q.sortBy('target_date', Q.asc)
      )
      .fetch();
  }

  // Get goal statistics
  async getGoalStatistics(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    paused: number;
    archived: number;
    overdue: number;
    completionRate: number;
  }> {
    const goals = await this.getUserGoals(userId);
    
    const stats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length,
      archived: goals.filter(g => g.status === 'archived').length,
      overdue: goals.filter(g => g.isOverdue).length,
      completionRate: 0,
    };
    
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }
    
    return stats;
  }

  // Get goals linked to a specific routine
  async getGoalsForRoutine(routineId: string): Promise<Goal[]> {
    // This would require a many-to-many relationship table
    // For now, we'll return an empty array
    // TODO: Implement when routine-goal linking is added
    return [];
  }

  // Reset goal progress
  async resetGoal(goalId: string): Promise<Goal | null> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return null;

    await goal.reset();
    console.log('[GoalRepository] Reset goal:', goal.name);
    return goal;
  }

  // Archive goal
  async archiveGoal(goalId: string): Promise<Goal | null> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return null;

    await goal.changeStatus('archived');
    console.log('[GoalRepository] Archived goal:', goal.name);
    return goal;
  }

  // Get goal categories
  async getCategories(userId: string): Promise<string[]> {
    const goals = await this.getUserGoals(userId);
    const categories = new Set(goals.map(g => g.category));
    return Array.from(categories).sort();
  }
}

// Export singleton instance
// Export a lazily initialized singleton
let _goalRepository: GoalRepository | null = null;
export const goalRepository = new Proxy({} as GoalRepository, {
  get(target, prop) {
    if (!_goalRepository) {
      _goalRepository = new GoalRepository();
    }
    return (_goalRepository as any)[prop];
  }
});
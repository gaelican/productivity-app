import { Model } from '@nozbe/watermelondb';
import { field, date, json, readonly, writer, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { sanitizeJson } from '../schema';

interface UserSettings {
  notifications: {
    enabled: boolean;
    dailyReminder?: string; // Time in HH:MM format
    taskDue?: boolean;
    streakReminder?: boolean;
  };
  privacy: {
    showProfile: boolean;
    shareProgress: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  sync: {
    wifiOnly: boolean;
    autoSync: boolean;
    syncInterval: number; // minutes
  };
}

interface ThemePreferences {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  customColors?: {
    [key: string]: string;
  };
}

export default class User extends Model {
  static table = 'users';
  
  static associations: Associations = {
    tasks: { type: 'has_many', foreignKey: 'user_id' },
    routines: { type: 'has_many', foreignKey: 'user_id' },
    goals: { type: 'has_many', foreignKey: 'user_id' },
  };

  @field('email') email!: string;
  @field('name') name!: string;
  @field('avatar_url') avatarUrl?: string;
  @field('device_tier') deviceTier!: 'basic' | 'standard' | 'premium';
  
  // Sync metadata
  @field('sync_status') syncStatus!: string;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  
  // JSON fields
  @json('settings', sanitizeJson) settings!: UserSettings;
  @json('theme_preferences', sanitizeJson) themePreferences!: ThemePreferences;
  
  // Relations
  @children('tasks') tasks!: any;
  @children('routines') routines!: any;
  @children('goals') goals!: any;
  
  // Methods
  @writer async updateDeviceTier(tier: 'basic' | 'standard' | 'premium') {
    await this.update((user) => {
      user.deviceTier = tier;
      user.syncStatus = 'pending';
    });
  }
  
  @writer async updateTheme(preferences: Partial<ThemePreferences>) {
    await this.update((user) => {
      user.themePreferences = {
        ...user.themePreferences,
        ...preferences
      };
      user.syncStatus = 'pending';
    });
  }
  
  @writer async updateSettings(settings: Partial<UserSettings>) {
    await this.update((user) => {
      user.settings = {
        ...user.settings,
        ...settings,
        notifications: {
          ...user.settings.notifications,
          ...(settings.notifications || {})
        },
        privacy: {
          ...user.settings.privacy,
          ...(settings.privacy || {})
        },
        accessibility: {
          ...user.settings.accessibility,
          ...(settings.accessibility || {})
        },
        sync: {
          ...user.settings.sync,
          ...(settings.sync || {})
        }
      };
      user.syncStatus = 'pending';
    });
  }
  
  @writer async setAvatar(url: string) {
    await this.update((user) => {
      user.avatarUrl = url;
      user.syncStatus = 'pending';
    });
  }
  
  // Getters
  get isBasicTier(): boolean {
    return this.deviceTier === 'basic';
  }
  
  get isStandardTier(): boolean {
    return this.deviceTier === 'standard';
  }
  
  get isPremiumTier(): boolean {
    return this.deviceTier === 'premium';
  }
  
  get canUseAnimations(): boolean {
    return !this.settings.accessibility.reduceMotion && 
           (this.deviceTier === 'standard' || this.deviceTier === 'premium');
  }
  
  get canUseAdvancedFeatures(): boolean {
    return this.deviceTier === 'premium';
  }
  
  get isDarkMode(): boolean {
    if (this.themePreferences.mode === 'dark') return true;
    if (this.themePreferences.mode === 'light') return false;
    
    // Auto mode - check system preference
    // This would need to be implemented based on the platform
    return false; // Default to light if auto
  }
  
  get notificationsEnabled(): boolean {
    return this.settings.notifications.enabled;
  }
  
  get shouldAutoSync(): boolean {
    return this.settings.sync.autoSync;
  }
  
  get shouldSyncOnWifiOnly(): boolean {
    return this.settings.sync.wifiOnly;
  }
  
  // Helper methods for tier-based features
  getAnimationDuration(baseMs: number): number {
    switch (this.deviceTier) {
      case 'basic':
        return 0; // No animations
      case 'standard':
        return baseMs;
      case 'premium':
        return baseMs * 0.8; // Slightly faster for premium
      default:
        return baseMs;
    }
  }
  
  getMaxConcurrentAnimations(): number {
    switch (this.deviceTier) {
      case 'basic':
        return 0;
      case 'standard':
        return 2;
      case 'premium':
        return 5;
      default:
        return 1;
    }
  }
  
  getCacheSize(): number {
    switch (this.deviceTier) {
      case 'basic':
        return 10; // MB
      case 'standard':
        return 50; // MB
      case 'premium':
        return 200; // MB
      default:
        return 10;
    }
  }
  
  async getActiveTasksCount(): Promise<number> {
    const tasks = await this.tasks.extend((q: any) => 
      q.where('is_completed', false)
    ).fetchCount();
    return tasks;
  }
  
  async getCompletedTasksCount(): Promise<number> {
    const tasks = await this.tasks.extend((q: any) => 
      q.where('is_completed', true)
    ).fetchCount();
    return tasks;
  }
  
  async getActiveGoalsCount(): Promise<number> {
    const goals = await this.goals.extend((q: any) => 
      q.where('status', 'active')
    ).fetchCount();
    return goals;
  }
  
  async getActiveRoutinesCount(): Promise<number> {
    const routines = await this.routines.fetchCount();
    return routines;
  }
}
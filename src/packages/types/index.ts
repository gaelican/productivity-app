// Device tier types for progressive enhancement
export type DeviceTier = 'basic' | 'standard' | 'premium';

// Priority types
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Sync status types
export type SyncStatus = 'pending' | 'synced' | 'conflict';

// Task types
export interface Task {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  icon: string;
  color: string;
  priority: Priority;
  dueDate?: Date;
  dueTime?: string;
  isCompleted: boolean;
  completedAt?: Date;
  progress: number;
  tags: string[];
  parsedInput?: string;
  
  // Relations
  userId: string;
  goalId?: string;
  routineId?: string;
  parentTaskId?: string;
  
  // Sync metadata
  deviceId: string;
  version: number;
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Routine types
export interface Routine {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  
  // Schedule
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduleConfig: any;
  hideTasksOnDashboard: boolean;
  
  // Progress tracking
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompleted?: Date;
  
  // Performance
  animationMode: DeviceTier;
  taskDependencies: any;
  timeRequirements: any;
  
  // Relations
  userId: string;
  
  // Sync metadata
  version: number;
  syncStatus: SyncStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Goal types
export interface Goal {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  
  // Progress
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercentage: number;
  
  // Interaction
  defaultTapAction: string;
  defaultIncrement: number;
  quickIncrements: number[];
  celebrationMode: DeviceTier;
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'archived';
  priority: Priority;
  targetDate?: Date;
  completedAt?: Date;
  
  // Progress history
  progressHistory: ProgressEntry[];
  
  // Relations
  userId: string;
  
  // Sync metadata
  version: number;
  syncStatus: SyncStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Progress entry for goals
export interface ProgressEntry {
  value: number;
  timestamp: number;
  source: 'manual' | 'task' | 'routine';
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  settings: UserSettings;
  themePreferences: ThemePreferences;
  deviceTier: DeviceTier;
  
  // Sync metadata
  syncStatus: SyncStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// User settings
export interface UserSettings {
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  animationsEnabled: boolean;
  batteryThreshold: number;
}

// Theme preferences
export interface ThemePreferences {
  colorScheme: 'light' | 'dark' | 'auto';
  primaryGradient: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Animation types
export interface AnimationConfig {
  priority: 'high' | 'medium' | 'low';
  duration: number;
  toValue: any;
  onComplete?: () => void;
}

// Performance metrics
export interface PerformanceMetrics {
  appLaunch: number;
  taskCreation: number;
  animationFPS: number;
  memoryUsage: number;
  batteryDrain: number;
}

// Re-export navigation types
export * from './navigation';
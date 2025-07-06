import { appSchema, tableSchema } from '@nozbe/watermelondb';
import { field, date, json, readonly, writer, lazy } from '@nozbe/watermelondb/decorators';

// Define the complete schema
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'settings', type: 'string' }, // JSON string
        { name: 'theme_preferences', type: 'string' }, // JSON string
        { name: 'device_tier', type: 'string' }, // 'basic' | 'standard' | 'premium'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'priority', type: 'string' }, // 'low' | 'medium' | 'high' | 'urgent'
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'due_time', type: 'string', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'progress', type: 'number' },
        { name: 'tags', type: 'string' }, // JSON array
        { name: 'parsed_input', type: 'string', isOptional: true },
        
        // Relations
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'routine_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'parent_task_id', type: 'string', isOptional: true, isIndexed: true },
        
        // Sync metadata for CRDT
        { name: 'device_id', type: 'string' },
        { name: 'version', type: 'number' },
        { name: 'sync_status', type: 'string' }, // 'pending' | 'synced' | 'conflict'
        { name: 'last_synced_at', type: 'number', isOptional: true },
        
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'routines',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        
        // Schedule with offline support
        { name: 'schedule_type', type: 'string' }, // 'daily' | 'weekly' | 'monthly' | 'custom'
        { name: 'schedule_config', type: 'string' }, // JSON
        { name: 'hide_tasks_on_dashboard', type: 'boolean' },
        
        // Offline-first tracking
        { name: 'current_streak', type: 'number' },
        { name: 'longest_streak', type: 'number' },
        { name: 'total_completions', type: 'number' },
        { name: 'last_completed', type: 'number', isOptional: true },
        
        // Performance mode support
        { name: 'animation_mode', type: 'string' }, // 'basic' | 'standard' | 'premium'
        { name: 'task_dependencies', type: 'string' }, // JSON
        { name: 'time_requirements', type: 'string' }, // JSON
        
        // Relations
        { name: 'user_id', type: 'string', isIndexed: true },
        
        // Sync metadata
        { name: 'version', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        
        // Progress tracking (works offline)
        { name: 'current_value', type: 'number' },
        { name: 'target_value', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'progress_percentage', type: 'number' },
        
        // Performance-aware interaction
        { name: 'default_tap_action', type: 'string' },
        { name: 'default_increment', type: 'number' },
        { name: 'quick_increments', type: 'string' }, // JSON array
        { name: 'celebration_mode', type: 'string' }, // 'basic' | 'standard' | 'premium'
        
        // Status
        { name: 'status', type: 'string' }, // 'active' | 'paused' | 'completed' | 'archived'
        { name: 'priority', type: 'string' }, // 'low' | 'medium' | 'high'
        { name: 'target_date', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        
        // Local progress history for offline predictions
        { name: 'progress_history', type: 'string' }, // JSON array
        
        // Relations
        { name: 'user_id', type: 'string', isIndexed: true },
        
        // Sync metadata
        { name: 'version', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Sync queue table for offline changes
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'model_type', type: 'string' }, // 'task' | 'routine' | 'goal'
        { name: 'model_id', type: 'string' },
        { name: 'operation', type: 'string' }, // 'create' | 'update' | 'delete'
        { name: 'data', type: 'string' }, // JSON
        { name: 'timestamp', type: 'number' },
        { name: 'device_id', type: 'string' },
        { name: 'version', type: 'number' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});

// Helper function to sanitize JSON
export const sanitizeJson = (json: any) => {
  try {
    if (typeof json === 'string') {
      return JSON.parse(json);
    }
    return json;
  } catch {
    return [];
  }
};

// Export schema as default
export default schema;
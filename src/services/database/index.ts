import { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import schema from './schema';
import migrations from './migrations';

// Import models
import User from './models/User';
import Task from './models/Task';
import Routine from './models/Routine';
import Goal from './models/Goal';
import SyncQueueItem from './models/SyncQueueItem';

let database: Database | null = null;

// Create platform-specific adapter
async function createPlatformAdapter() {
  if (Platform.OS === 'web') {
    // Use LokiJS adapter for web
    return new LokiJSAdapter({
      schema,
      useWebWorker: false, // Disable web worker for simplicity
      useIncrementalIndexedDB: true, // Use IndexedDB for persistence
      dbName: 'productivity_app_db', // Database name
      onQuotaExceededError: (error) => {
        console.error('Storage quota exceeded:', error);
      },
    });
  } else {
    // Dynamically import SQLite adapter for native platforms
    // This ensures SQLite is not bundled for web
    const { default: SQLiteAdapter } = await import('@nozbe/watermelondb/adapters/sqlite');
    
    return new SQLiteAdapter({
      schema,
      migrations,
      jsi: Platform.OS === 'ios',
      onSetUpError: (error: Error) => {
        console.error('Database setup error:', error);
      },
    });
  }
}

export async function getDatabase(): Promise<Database> {
  if (database) {
    return database;
  }

  try {
    const adapter = await createPlatformAdapter();
    
    database = new Database({
      adapter,
      modelClasses: [User, Task, Routine, Goal, SyncQueueItem],
    });
    
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export { database };
import { Database } from '@nozbe/watermelondb';
import { getDatabase } from './index';

// This file provides a synchronous interface to the database
// Note: You must ensure getDatabase() is called before using these exports

let _database: Database | null = null;

// Initialize database on first import
getDatabase().then(db => {
  _database = db;
}).catch(error => {
  console.error('Failed to initialize database:', error);
});

// Export a getter that throws if database is not initialized
export const database = new Proxy({} as Database, {
  get(target, prop) {
    if (!_database) {
      throw new Error('Database not initialized. Make sure setupDatabase() is called before using the database.');
    }
    return (_database as any)[prop];
  }
});

// Export collections for easy access
// These will be undefined until the database is initialized
export const getDatabaseCollections = () => {
  if (!database) {
    throw new Error('Database not initialized. Call getDatabase() first.');
  }
  
  return {
    usersCollection: database.get('users'),
    tasksCollection: database.get('tasks'),
    routinesCollection: database.get('routines'),
    goalsCollection: database.get('goals'),
    syncQueueCollection: database.get('sync_queue'),
  };
};

// Database helper functions
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.write(async () => {
    await db.unsafeResetDatabase();
  });
}

export async function getDatabaseInfo(): Promise<{
  taskCount: number;
  routineCount: number;
  goalCount: number;
  pendingSyncCount: number;
}> {
  const db = await getDatabase();
  const collections = {
    tasksCollection: db.get('tasks'),
    routinesCollection: db.get('routines'),
    goalsCollection: db.get('goals'),
    syncQueueCollection: db.get('sync_queue'),
  };
  
  const [taskCount, routineCount, goalCount, pendingSyncCount] = await Promise.all([
    collections.tasksCollection.query().fetchCount(),
    collections.routinesCollection.query().fetchCount(),
    collections.goalsCollection.query().fetchCount(),
    collections.syncQueueCollection.query().fetchCount(),
  ]);

  return {
    taskCount,
    routineCount,
    goalCount,
    pendingSyncCount,
  };
}

// Performance monitoring
export async function setupPerformanceMonitoring(): Promise<void> {
  if (__DEV__) {
    let queryCount = 0;
    let writeCount = 0;

    try {
      const db = await getDatabase();
      
      // Monitor database operations (only for SQLite adapter)
      const underlyingAdapter = (db.adapter as any).underlyingAdapter;
      if (underlyingAdapter && underlyingAdapter._raw) {
        underlyingAdapter._raw.on('query', () => {
          queryCount++;
          if (queryCount % 100 === 0) {
            console.log(`Database queries: ${queryCount}`);
          }
        });

        underlyingAdapter._raw.on('write', () => {
          writeCount++;
          if (writeCount % 50 === 0) {
            console.log(`Database writes: ${writeCount}`);
          }
        });

        // Reset counters periodically
        setInterval(() => {
          console.log(`Database stats - Queries: ${queryCount}, Writes: ${writeCount}`);
          queryCount = 0;
          writeCount = 0;
        }, 60000); // Every minute
      }
    } catch (error) {
      console.log('Performance monitoring not available for this adapter');
    }
  }
}
import { getDatabase } from './index';
import { Platform } from 'react-native';

// Initialize database with default data for testing
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Get database instance
    const database = await getDatabase();
    
    // Check if we have any users
    const usersCollection = database.get('users');
    const userCount = await usersCollection.query().fetchCount();
    
    // Also check if we have any routines to ensure full initialization
    const routinesCollection = database.get('routines');
    const routineCount = await routinesCollection.query().fetchCount();
    
    if (userCount === 0 || routineCount === 0) {
      console.log('Initializing database with default data...');
      
      // Clear any partial data first
      if (userCount > 0 || routineCount > 0) {
        console.log('Clearing partial data...');
        await database.write(async () => {
          await database.unsafeResetDatabase();
        });
      }
      
      // Create a default user
      await database.write(async () => {
        await usersCollection.create((user: any) => {
          user.email = 'user@example.com';
          user.name = 'Default User';
          user.deviceTier = 'standard';
          user.syncStatus = 'synced';
          user.settings = {
            notifications: {
              enabled: true,
              taskDue: true,
              streakReminder: true,
            },
            privacy: {
              showProfile: true,
              shareProgress: true,
            },
            accessibility: {
              reduceMotion: false,
              highContrast: false,
              fontSize: 'medium',
            },
            sync: {
              wifiOnly: false,
              autoSync: true,
              syncInterval: 15,
            },
          };
          user.themePreferences = {
            mode: 'light',
            primaryColor: '#6366F1',
            accentColor: '#8B5CF6',
          };
        });
      });
      
      // Create some sample tasks for the user
      const tasksCollection = database.get('tasks');
      await database.write(async () => {
        // Task 1
        await tasksCollection.create((task: any) => {
          task.name = 'Welcome to Productivity App!';
          task.description = 'Tap to mark as complete, long press for options';
          task.icon = '👋';
          task.color = 'ocean';
          task.priority = 'medium';
          task.isCompleted = false;
          task.progress = 0;
          task.userId = 'user1';
          task.deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
          task.version = 1;
          task.syncStatus = 'synced';
          task.tags = ['tutorial'];
        });
        
        // Task 2
        await tasksCollection.create((task: any) => {
          task.name = 'Try creating a new task';
          task.description = 'Use the + button to add your own tasks';
          task.icon = '➕';
          task.color = 'lime';
          task.priority = 'low';
          task.isCompleted = false;
          task.progress = 0;
          task.userId = 'user1';
          task.deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
          task.version = 1;
          task.syncStatus = 'synced';
          task.tags = ['tutorial'];
        });
        
        // Task 3
        await tasksCollection.create((task: any) => {
          task.name = 'Explore natural language input';
          task.description = 'Try "Buy milk tomorrow at 5pm"';
          task.icon = '🗣️';
          task.color = 'purple';
          task.priority = 'low';
          task.isCompleted = false;
          task.progress = 0;
          task.userId = 'user1';
          task.deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
          task.version = 1;
          task.syncStatus = 'synced';
          task.tags = ['tutorial'];
        });
      });
      
      // Create some sample routines
      const routinesCollection = database.get('routines');
      await database.write(async () => {
        // Morning Routine
        const morningRoutine = await routinesCollection.create((routine: any) => {
          routine.name = 'Morning Routine';
          routine.description = 'Start your day right with this energizing routine';
          routine.icon = '🌅';
          routine.color = 'ocean';
          routine.scheduleType = 'daily';
          routine.hideTasksOnDashboard = false;
          routine.currentStreak = 7;
          routine.longestStreak = 12;
          routine.totalCompletions = 42;
          routine.lastCompleted = Date.now() - 86400000; // Yesterday
          routine.animationMode = 'standard';
          routine.userId = 'user1';
          routine.version = 1;
          routine.syncStatus = 'synced';
          routine.scheduleConfig = {
            time: '06:00',
          };
          routine.taskDependencies = [];
          routine.timeRequirements = {
            idealMinutes: 45,
          };
        });
        
        // Create tasks for morning routine
        await tasksCollection.create((task: any) => {
          task.name = 'Drink Water';
          task.description = 'Start with hydration';
          task.icon = '💧';
          task.color = 'ocean';
          task.priority = 'high';
          task.isCompleted = false;
          task.progress = 0;
          task.userId = 'user1';
          task.routineId = morningRoutine.id;
          task.deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
          task.version = 1;
          task.syncStatus = 'synced';
          task.tags = ['health', 'morning'];
        });
        
        await tasksCollection.create((task: any) => {
          task.name = 'Morning Stretch';
          task.description = '15 minutes of stretching';
          task.icon = '🧘';
          task.color = 'mint';
          task.priority = 'medium';
          task.isCompleted = false;
          task.progress = 0;
          task.userId = 'user1';
          task.routineId = morningRoutine.id;
          task.deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
          task.version = 1;
          task.syncStatus = 'synced';
          task.tags = ['exercise', 'morning'];
        });
        
        await tasksCollection.create((task: any) => {
          task.name = 'Meditation';
          task.description = '10 minutes of mindfulness';
          task.icon = '🧘‍♀️';
          task.color = 'purple';
          task.priority = 'medium';
          task.isCompleted = false;
          task.progress = 0;
          task.userId = 'user1';
          task.routineId = morningRoutine.id;
          task.deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
          task.version = 1;
          task.syncStatus = 'synced';
          task.tags = ['mindfulness', 'morning'];
        });
        
        // Evening Routine
        await routinesCollection.create((routine: any) => {
          routine.name = 'Evening Wind Down';
          routine.description = 'Relax and prepare for restful sleep';
          routine.icon = '🌙';
          routine.color = 'purple';
          routine.scheduleType = 'daily';
          routine.hideTasksOnDashboard = true;
          routine.currentStreak = 3;
          routine.longestStreak = 15;
          routine.totalCompletions = 28;
          routine.lastCompleted = Date.now() - 172800000; // 2 days ago
          routine.animationMode = 'standard';
          routine.userId = 'user1';
          routine.version = 1;
          routine.syncStatus = 'synced';
          routine.scheduleConfig = {
            time: '21:00',
          };
          routine.taskDependencies = [];
          routine.timeRequirements = {
            idealMinutes: 30,
          };
        });
      });
      
      console.log('Database initialized with default data');
    } else {
      console.log('Database already initialized');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Setup database on app start
export async function setupDatabase() {
  try {
    await initializeDatabase();
    console.log('Database setup complete');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}
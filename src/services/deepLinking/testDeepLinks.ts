import { Linking } from 'react-native';

/**
 * Utility for testing deep links during development
 * These functions can be called from the app to simulate deep link navigation
 */
export const testDeepLinks = {
  /**
   * Test opening a task detail screen
   */
  async openTaskDetail(taskId: string) {
    const url = `productivityapp://task/${taskId}`;
    console.log('Testing deep link:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  },

  /**
   * Test opening task creation screen
   */
  async createTask() {
    const url = 'productivityapp://create-task';
    console.log('Testing deep link:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  },

  /**
   * Test opening a routine detail screen
   */
  async openRoutineDetail(routineId: string) {
    const url = `productivityapp://routine/${routineId}`;
    console.log('Testing deep link:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  },

  /**
   * Test opening routine creation screen
   */
  async createRoutine() {
    const url = 'productivityapp://create-routine';
    console.log('Testing deep link:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  },

  /**
   * Test opening a goal detail screen
   */
  async openGoalDetail(goalId: string) {
    const url = `productivityapp://goal/${goalId}`;
    console.log('Testing deep link:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  },

  /**
   * Test opening goal creation screen
   */
  async createGoal() {
    const url = 'productivityapp://create-goal';
    console.log('Testing deep link:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  },

  /**
   * Log all supported deep link patterns
   */
  logSupportedPatterns() {
    console.log('Supported Deep Link Patterns:');
    console.log('- productivityapp://task/{taskId} - Open task details');
    console.log('- productivityapp://create-task - Create new task');
    console.log('- productivityapp://routine/{routineId} - Open routine details');
    console.log('- productivityapp://create-routine - Create new routine');
    console.log('- productivityapp://goal/{goalId} - Open goal details');
    console.log('- productivityapp://create-goal - Create new goal');
    console.log('- productivityapp://settings - Open settings');
    console.log('- productivityapp://profile/{userId} - Open user profile');
  },
};

// Export for use in development/debugging
if (__DEV__) {
  // Make it available globally for easy testing in development
  (global as any).testDeepLinks = testDeepLinks;
}
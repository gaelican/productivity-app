import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { getWidgetSyncService, cleanupWidgetSyncService } from './WidgetSyncService';

/**
 * Hook to set up widget synchronization with the database
 * Should be used in the root component of the app
 */
export function useWidgetSync() {
  const database = useDatabase();
  const appStateRef = useRef(AppState.currentState);
  const syncServiceRef = useRef<ReturnType<typeof getWidgetSyncService> | null>(null);

  useEffect(() => {
    // Only set up widget sync on Android
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      // Get or create widget sync service
      const syncService = getWidgetSyncService(database);
      syncServiceRef.current = syncService;

      // Start syncing
      syncService.start();
      console.log('Widget sync service started');

      // Handle app state changes to refresh widget when app comes to foreground
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App has come to foreground, refresh widget data
          syncService.handleWidgetRefresh();
        }
        appStateRef.current = nextAppState;
      };

      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

      // Set up native event listeners for widget interactions
      // Note: These would need to be implemented in the native module
      // Example:
      // const widgetEventSubscription = WidgetModule.addListener('onTaskCompleted', (event) => {
      //   syncService.handleWidgetTaskCompletion(event.taskId);
      // });

      // Cleanup function
      return () => {
        console.log('Cleaning up widget sync service');
        
        if (syncServiceRef.current) {
          syncServiceRef.current.stop();
        }
        
        appStateSubscription.remove();
        
        // Clean up native event listeners
        // widgetEventSubscription?.remove();
      };
    } catch (error) {
      console.error('Failed to initialize widget sync:', error);
    }
  }, [database]);

  // Provide manual refresh function
  const refreshWidget = () => {
    if (Platform.OS === 'android' && syncServiceRef.current) {
      syncServiceRef.current.handleWidgetRefresh();
    }
  };

  return {
    refreshWidget,
    isSupported: Platform.OS === 'android'
  };
}
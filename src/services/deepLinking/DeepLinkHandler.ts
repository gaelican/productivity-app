import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

export class DeepLinkHandler {
  private navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>;

  constructor(navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>) {
    this.navigationRef = navigationRef;
  }

  /**
   * Parse and handle deep links
   * Supported patterns:
   * - productivityapp://task/{id} - Open task details
   * - productivityapp://create-task - Open task creation
   * - productivityapp://routine/{id} - Open routine details
   * - productivityapp://create-routine - Open routine creation
   * - productivityapp://goal/{id} - Open goal details
   * - productivityapp://create-goal - Open goal creation
   */
  async handleDeepLink(url: string) {
    if (!url || !this.navigationRef.current) {
      return;
    }

    try {
      const { hostname, pathname } = this.parseUrl(url);
      
      switch (hostname) {
        case 'task':
          if (pathname) {
            // Open task details with the provided ID
            this.navigationRef.current.navigate('TaskDetail', { taskId: pathname });
          }
          break;
          
        case 'create-task':
          // Open task creation screen
          this.navigationRef.current.navigate('TaskCreate');
          break;
          
        case 'routine':
          if (pathname) {
            // Open routine details with the provided ID
            this.navigationRef.current.navigate('RoutineDetail', { routineId: pathname });
          }
          break;
          
        case 'create-routine':
          // Open routine creation screen
          this.navigationRef.current.navigate('RoutineCreate');
          break;
          
        case 'goal':
          if (pathname) {
            // Open goal details with the provided ID
            this.navigationRef.current.navigate('GoalDetail', { goalId: pathname });
          }
          break;
          
        case 'create-goal':
          // Open goal creation screen
          this.navigationRef.current.navigate('GoalCreate');
          break;
          
        default:
          console.warn(`Unknown deep link pattern: ${url}`);
          // Navigate to home/dashboard as fallback
          this.navigationRef.current.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Parse URL to extract hostname and pathname
   */
  private parseUrl(url: string): { hostname: string; pathname?: string } {
    try {
      // Remove the scheme prefix
      const urlWithoutScheme = url.replace(/^productivityapp:\/\//, '');
      
      // Split by '/' to get parts
      const parts = urlWithoutScheme.split('/');
      
      return {
        hostname: parts[0],
        pathname: parts[1] || undefined,
      };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return { hostname: '' };
    }
  }

  /**
   * Set up initial deep link handling
   */
  async setupInitialUrl() {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await this.handleDeepLink(initialUrl);
      }
    } catch (error) {
      console.error('Error getting initial URL:', error);
    }
  }

  /**
   * Set up listener for incoming deep links
   */
  setupListener() {
    const subscription = Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });

    return subscription;
  }
}

/**
 * Configuration for linking
 */
export const linkingConfiguration = {
  prefixes: ['productivityapp://', 'https://productivityapp.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Tasks: 'tasks',
          Routines: 'routines',
          Feed: 'feed',
          Profile: 'profile',
        },
      },
      TaskDetail: 'task/:taskId',
      TaskCreate: 'create-task',
      RoutineDetail: 'routine/:routineId',
      RoutineCreate: 'create-routine',
      GoalDetail: 'goal/:goalId',
      GoalCreate: 'create-goal',
      Settings: 'settings',
      FriendProfile: 'profile/:userId',
    },
  },
};
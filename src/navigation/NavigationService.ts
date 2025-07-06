import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList, DeepLinkParams } from './types';

// Navigation service for handling navigation from outside React components
class NavigationService {
  private navigator: NavigationContainerRef<RootStackParamList> | null = null;

  // Set the navigator reference
  setNavigator(navigator: NavigationContainerRef<RootStackParamList>) {
    this.navigator = navigator;
  }

  // Navigate to a screen
  navigate<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName]
  ) {
    if (this.navigator) {
      this.navigator.navigate(routeName, params);
    }
  }

  // Go back
  goBack() {
    if (this.navigator && this.navigator.canGoBack()) {
      this.navigator.goBack();
    }
  }

  // Reset navigation state
  reset(routes: Array<{ name: keyof RootStackParamList; params?: any }>) {
    if (this.navigator) {
      this.navigator.reset({
        index: 0,
        routes,
      });
    }
  }

  // Handle deep links from widgets
  handleDeepLink(params: DeepLinkParams) {
    if (!this.navigator) {
      console.warn('Navigator not initialized');
      return;
    }

    switch (params.action) {
      case 'open_task':
        if (params.taskId) {
          this.navigate('TaskDetail', { taskId: params.taskId });
        }
        break;

      case 'create_task':
        this.navigate('TaskCreate', {
          widgetContext: params.widgetContext,
        });
        break;

      case 'complete_task':
        // Handle task completion from widget
        // This would typically update the database and then navigate
        if (params.taskId) {
          // Complete task logic here
          this.navigate('Main', {
            screen: 'Feed',
          });
        }
        break;

      default:
        // Navigate to dashboard by default
        this.navigate('Main', {
          screen: 'Dashboard',
        });
    }
  }

  // Handle widget tap with URL
  handleWidgetUrl(url: string) {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'task') {
        if (pathParts[1] === 'create') {
          this.handleDeepLink({ action: 'create_task' });
        } else if (pathParts[1]) {
          this.handleDeepLink({ action: 'open_task', taskId: pathParts[1] });
        }
      } else if (pathParts[0] === 'routine' && pathParts[1]) {
        this.navigate('RoutineDetail', { routineId: pathParts[1] });
      } else if (pathParts[0] === 'goal' && pathParts[1]) {
        this.navigate('GoalDetail', { goalId: pathParts[1] });
      } else {
        // Default to dashboard
        this.navigate('Main', { screen: 'Dashboard' });
      }
    } catch (error) {
      console.error('Error parsing deep link URL:', error);
      // Navigate to dashboard on error
      this.navigate('Main', { screen: 'Dashboard' });
    }
  }

  // Check if we can go back
  canGoBack(): boolean {
    return this.navigator?.canGoBack() ?? false;
  }

  // Get current route name
  getCurrentRouteName(): string | undefined {
    if (!this.navigator) return undefined;
    
    const state = this.navigator.getRootState();
    if (!state) return undefined;

    const route = state.routes[state.index];
    return route.name;
  }

  // Navigate to a tab
  navigateToTab(tabName: 'Dashboard' | 'Feed' | 'Profile') {
    this.navigate('Main', {
      screen: tabName,
    });
  }

  // Open modal screens
  openTaskModal(taskId?: string) {
    if (taskId) {
      this.navigate('TaskEdit', { taskId });
    } else {
      this.navigate('TaskCreate');
    }
  }

  openRoutineModal(routineId?: string) {
    if (routineId) {
      this.navigate('RoutineEdit', { routineId });
    } else {
      this.navigate('RoutineCreate');
    }
  }

  openGoalModal(goalId?: string) {
    if (goalId) {
      this.navigate('GoalEdit', { goalId });
    } else {
      this.navigate('GoalCreate');
    }
  }
}

// Export singleton instance
export default new NavigationService();
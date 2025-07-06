import { NavigatorScreenParams } from '@react-navigation/native';
import { Task, Routine, Goal } from '../types';

// Root Navigation Types
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  TaskDetail: { taskId: string };
  TaskCreate: { 
    prefillText?: string;
    widgetContext?: string;
  } | undefined;
  TaskEdit: { taskId: string };
  RoutineDetail: { routineId: string };
  RoutineCreate: undefined;
  RoutineEdit: { routineId: string };
  GoalDetail: { goalId: string };
  GoalCreate: undefined;
  GoalEdit: { goalId: string };
  Settings: undefined;
  ThemeSettings: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  DataBackup: undefined;
  HelpSupport: undefined;
  AddFriend: undefined;
  FriendProfile: { userId: string };
};

// Main Tab Navigation Types
export type MainTabParamList = {
  Dashboard: undefined;
  Routines: undefined;
  Goals: undefined;
  Feed: undefined;
  Profile: undefined;
};

// Navigation Props Types
export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: import('@react-navigation/bottom-tabs').BottomTabNavigationProp<MainTabParamList, T>;
  route: import('@react-navigation/bottom-tabs').BottomTabScreenProps<MainTabParamList, T>['route'];
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList, T>;
  route: import('@react-navigation/native-stack').NativeStackScreenProps<RootStackParamList, T>['route'];
};

// Deep Link Types
export type DeepLinkParams = {
  action: 'open_task' | 'create_task' | 'complete_task';
  taskId?: string;
  filter?: string;
  showCreateModal?: boolean;
  widgetContext?: string;
};

// Navigation State Types
export type NavigationState = {
  currentTab: keyof MainTabParamList;
  previousTab?: keyof MainTabParamList;
  modalStack: string[];
  deepLinkPending?: DeepLinkParams;
};

// Transition Config Types
export type TransitionConfig = {
  type: 'instant' | 'slide' | 'spring';
  duration: number;
  easing?: string;
  parallax?: boolean;
};

// Performance Tier Types for Navigation
export type NavigationPerformanceTier = 'basic' | 'standard' | 'premium';

export interface NavigationConfig {
  performanceTier: NavigationPerformanceTier;
  transitions: {
    basic: TransitionConfig;
    standard: TransitionConfig;
    premium: TransitionConfig;
  };
  animationBudget: {
    maxConcurrent: number;
    backgroundAnimations: boolean | 'limited' | 'full';
  };
}
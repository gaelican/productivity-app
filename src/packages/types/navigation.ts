import { NavigatorScreenParams } from '@react-navigation/native';
import { Task, Routine, Goal } from './index';

// Root Stack Navigator Params
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  TaskDetail: { taskId: string; task?: Task };
  TaskCreate: { mode: 'quick' | 'magic' | 'standard'; prefilledText?: string };
  RoutineDetail: { routineId: string; routine?: Routine };
  RoutineCreate: undefined;
  GoalDetail: { goalId: string; goal?: Goal };
  GoalCreate: undefined;
  Settings: undefined;
  FriendProfile: { userId: string };
};

// Main Bottom Tab Navigator Params
export type MainTabParamList = {
  Dashboard: undefined;
  Routines: undefined;
  Goals: undefined;
  Feed: undefined;
  Profile: undefined;
};

// Stack Navigators for each tab
export type DashboardStackParamList = {
  DashboardHome: undefined;
  TaskDetail: { taskId: string };
  RoutineDetail: { routineId: string };
  GoalDetail: { goalId: string };
};

export type FeedStackParamList = {
  FeedHome: undefined;
  TaskDetail: { taskId: string };
  UserProfile: { userId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  Friends: undefined;
  EditProfile: undefined;
  DataBackup: undefined;
  ThemeSettings: undefined;
  NotificationSettings: undefined;
};

// Screen prop types
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: import('@react-navigation/native-stack').NativeStackNavigationProp<
    RootStackParamList,
    T
  >;
  route: import('@react-navigation/native-stack').RouteProp<RootStackParamList, T>;
};

export type TabScreenProps<T extends keyof MainTabParamList> = {
  navigation: import('@react-navigation/bottom-tabs').BottomTabNavigationProp<
    MainTabParamList,
    T
  >;
  route: import('@react-navigation/bottom-tabs').RouteProp<MainTabParamList, T>;
};
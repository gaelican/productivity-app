import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransitionPresets } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { RootStackParamList } from './types';
import { useDeviceTier } from '../hooks/useDeviceTier';
import { useBattery } from '../hooks/useBattery';
import { useAnimationBudget } from '../hooks/useAnimationBudget';

// Navigator components
import { BottomTabNavigator } from './BottomTabNavigator';

// Screen imports (these will be implemented separately)
// import TaskDetailScreen from '../screens/TaskDetailScreen';
import { TaskCreateScreen } from '../screens/Tasks/TaskCreateScreen';
import { TaskEditScreen } from '../screens/Tasks/TaskEditScreen';
// import RoutineDetailScreen from '../screens/RoutineDetailScreen';
import { RoutineCreateScreen } from '../screens/Routines/RoutineCreateScreen';
// import RoutineEditScreen from '../screens/RoutineEditScreen';
// import GoalDetailScreen from '../screens/GoalDetailScreen';
import { GoalCreateScreen } from '../screens/Goals/GoalCreateScreen';
// import GoalEditScreen from '../screens/GoalEditScreen';
// import SettingsScreen from '../screens/SettingsScreen';
// import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
// import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
// import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
// import DataBackupScreen from '../screens/DataBackupScreen';
// import HelpSupportScreen from '../screens/HelpSupportScreen';
// import AddFriendScreen from '../screens/AddFriendScreen';
// import FriendProfileScreen from '../screens/FriendProfileScreen';

// Placeholder screens
const PlaceholderScreen = () => null;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking = {
  prefixes: ['productivity://', 'https://app.productivity.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Feed: 'feed',
          Profile: 'profile',
        },
      },
      TaskDetail: 'task/:taskId',
      TaskCreate: 'task/create',
      RoutineDetail: 'routine/:routineId',
      GoalDetail: 'goal/:goalId',
      Settings: 'settings',
    },
  },
};

export function RootNavigator() {
  const deviceTier = useDeviceTier();
  const battery = useBattery();
  const animationBudget = useAnimationBudget();

  // Get performance-based screen options
  const getScreenOptions = () => {
    const baseOptions = {
      headerShown: false,
      contentStyle: {
        backgroundColor: 'transparent',
      },
    };

    // Basic tier or low battery - no animations
    if (deviceTier === 'basic' || battery.level < 20) {
      return {
        ...baseOptions,
        animation: 'none' as const,
      };
    }

    // Standard tier - simple transitions
    if (deviceTier === 'standard' || battery.level < 30) {
      return {
        ...baseOptions,
        animation: 'slide_from_right' as const,
        animationDuration: 300,
      };
    }

    // Premium tier with good battery - full animations
    if (animationBudget.canAnimate('navigation')) {
      return {
        ...baseOptions,
        animation: 'slide_from_right' as const,
        animationDuration: 400,
        ...TransitionPresets.SlideFromRightIOS,
      };
    }

    return baseOptions;
  };

  // Handle deep links from widgets
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      // Parse and navigate based on URL
      console.log('Deep link received:', url);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={getScreenOptions()}
        initialRouteName="Main"
      >
        {/* Main tab navigator */}
        <Stack.Screen 
          name="Main" 
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Task screens */}
        <Stack.Screen 
          name="TaskDetail" 
          component={PlaceholderScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Task Details',
          }}
        />
        <Stack.Screen 
          name="TaskCreate" 
          component={TaskCreateScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="TaskEdit" 
          component={TaskEditScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* Routine screens */}
        <Stack.Screen 
          name="RoutineDetail" 
          component={PlaceholderScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Routine Details',
          }}
        />
        <Stack.Screen 
          name="RoutineCreate" 
          component={RoutineCreateScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="RoutineEdit" 
          component={PlaceholderScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Edit Routine',
          }}
        />

        {/* Goal screens */}
        <Stack.Screen 
          name="GoalDetail" 
          component={PlaceholderScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Goal Details',
          }}
        />
        <Stack.Screen 
          name="GoalCreate" 
          component={GoalCreateScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="GoalEdit" 
          component={PlaceholderScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Edit Goal',
          }}
        />

        {/* Settings and profile screens */}
        <Stack.Screen 
          name="Settings" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Settings',
          }}
        />
        <Stack.Screen 
          name="ThemeSettings" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Theme & Display',
          }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Notifications',
          }}
        />
        <Stack.Screen 
          name="PrivacySettings" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Privacy',
          }}
        />
        <Stack.Screen 
          name="DataBackup" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Data & Backup',
          }}
        />
        <Stack.Screen 
          name="HelpSupport" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Help & Support',
          }}
        />

        {/* Social screens */}
        <Stack.Screen 
          name="AddFriend" 
          component={PlaceholderScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Add Friend',
          }}
        />
        <Stack.Screen 
          name="FriendProfile" 
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            headerTitle: 'Friend Profile',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
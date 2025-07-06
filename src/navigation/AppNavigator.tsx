import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { linkingConfiguration, useDeepLinking } from '../services/deepLinking';

// Import screens that will be used in root stack
// These will be created after the main navigation structure

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  // Set up deep linking
  useDeepLinking(navigationRef);
  
  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={linkingConfiguration}
    >
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Default animation, will be adjusted based on device tier
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabNavigator} 
        />
        {/* Task-related screens */}
        {/* <Stack.Screen 
          name="TaskDetail" 
          component={TaskDetailScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        /> */}
        {/* <Stack.Screen 
          name="TaskCreate" 
          component={TaskCreateScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        /> */}
        
        {/* Routine-related screens */}
        {/* <Stack.Screen 
          name="RoutineDetail" 
          component={RoutineDetailScreen}
        /> */}
        {/* <Stack.Screen 
          name="RoutineCreate" 
          component={RoutineCreateScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        /> */}
        
        {/* Goal-related screens */}
        {/* <Stack.Screen 
          name="GoalDetail" 
          component={GoalDetailScreen}
        /> */}
        {/* <Stack.Screen 
          name="GoalCreate" 
          component={GoalCreateScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        /> */}
        
        {/* Settings and Profile */}
        {/* <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
        /> */}
        {/* <Stack.Screen 
          name="FriendProfile" 
          component={FriendProfileScreen}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
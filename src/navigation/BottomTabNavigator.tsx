import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../packages/types';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens (to be created)
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { FeedScreen } from '../screens/Feed/FeedScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
// import { RoutineListScreen } from '../screens/Routines/RoutineListScreen';
// import { RoutineListScreen } from '../screens/Routines/RoutineListScreenSafe';
import { RoutineListScreen } from '../screens/Routines/RoutineListScreenFixed';
import { GoalListScreen } from '../screens/Goals/GoalListScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icons - using emojis for now, can be replaced with proper icons
const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    Routines: '🔄',
    Goals: '🎯',
    Feed: '📰',
    Profile: '👤',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name]}
      </Text>
    </View>
  );
};

export function BottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.9)', 'rgba(139, 92, 246, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarIcon: ({ focused }) => (
          <TabBarIcon name={route.name} focused={focused} />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -5,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Routines" 
        component={RoutineListScreen}
        options={{
          tabBarLabel: 'Routines',
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalListScreen}
        options={{
          tabBarLabel: 'Goals',
        }}
      />
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
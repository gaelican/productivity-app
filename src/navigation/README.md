# Navigation Structure

This directory contains the navigation implementation for the productivity app, following the specifications from the documentation.

## Structure

### Main Navigation
- **Bottom Tab Navigator** with 3 tabs:
  - 📊 Dashboard - Main productivity view
  - 📰 Feed - Completed tasks timeline
  - 👤 Profile - User profile & settings

### Stack Navigation
- Modal screens for creating/editing tasks, routines, and goals
- Settings screens accessible from the Profile tab
- Friend management screens

## Key Files

- `types.ts` - TypeScript types for navigation
- `RootNavigator.tsx` - Main navigation container with stack navigator
- `BottomTabNavigator.tsx` - Tab bar implementation
- `NavigationService.ts` - Navigation utilities for deep linking and programmatic navigation
- `transitions/` - Performance-based screen transition animations

## Performance Tiers

Navigation adapts based on device capabilities:

1. **Basic Tier**
   - Instant transitions (no animations)
   - Simple tab bar without blur effect
   - Optimized for low-end devices or battery saving

2. **Standard Tier**
   - 300ms slide transitions
   - Basic animations
   - Semi-transparent tab bar

3. **Premium Tier**
   - 400ms spring physics transitions
   - Parallax effects
   - Blur effect on tab bar (iOS)
   - Full animation suite

## Deep Linking

The app supports deep linking from widgets:
- `productivity://task/create` - Create new task
- `productivity://task/{taskId}` - Open specific task
- `productivity://routine/{routineId}` - Open routine
- `productivity://goal/{goalId}` - Open goal

## Usage

```typescript
// Navigate to a screen
navigation.navigate('TaskDetail', { taskId: '123' });

// Navigate to a tab
navigation.navigate('Main', { screen: 'Feed' });

// Use NavigationService for navigation outside components
import NavigationService from './navigation/NavigationService';
NavigationService.navigate('TaskCreate');
```
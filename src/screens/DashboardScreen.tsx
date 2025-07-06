import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabScreenProps } from '../navigation/types';
import { useDeviceTier } from '../hooks/useDeviceTier';
import { useTheme } from '../hooks/useTheme';
import { useOfflineFirst } from '../hooks/useOfflineFirst';
import { useBattery } from '../hooks/useBattery';

// Component imports (to be implemented)
import { FilterMenu } from '../components/dashboard/FilterMenu';
import { TaskCard } from '../core/tasks/TaskCard';
import { RoutineCard } from '../components/cards/RoutineCard';
import { GoalCard } from '../components/cards/GoalCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { FloatingActionButton } from '../components/common/FloatingActionButton';
import { SunnyHillsideBackground } from '../components/background/SunnyHillsideBackground';
import { StaticBackground } from '../components/background/StaticBackground';

const { width: screenWidth } = Dimensions.get('window');

interface FilterState {
  type: 'all' | 'tasks' | 'routines' | 'goals';
  status: 'all' | 'active' | 'completed' | 'scheduled';
  time: 'all' | 'today' | 'week' | 'overdue';
}

interface DashboardSection {
  id: string;
  name: string;
  items: Array<any>; // Will be typed properly with Task | Routine | Goal
}

export default function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const deviceTier = useDeviceTier();
  const theme = useTheme();
  const battery = useBattery();
  const { data: dashboardData, loading, error, refresh } = useOfflineFirst('dashboard_items');

  // State
  const [filterMenuExpanded, setFilterMenuExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'active',
    time: 'all',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [columns, setColumns] = useState(getDefaultColumns());

  // Get default columns based on device
  function getDefaultColumns() {
    if (screenWidth < 768) return 1; // Mobile
    if (screenWidth < 1024) return 2; // Tablet
    return 3; // Desktop
  }

  // Calculate actual columns based on device tier and screen size
  const actualColumns = useMemo(() => {
    if (deviceTier === 'basic') return 1; // Force single column on basic devices
    return columns;
  }, [deviceTier, columns]);

  // Filter items based on current filters
  const filteredSections = useMemo(() => {
    if (!dashboardData) return [];

    // Apply filters and group into sections
    const filtered = dashboardData.filter(item => {
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      // Time filter logic would go here
      return true;
    });

    // Group by sections (this is simplified - real implementation would be more complex)
    return [
      { id: 'today', name: 'Today', items: filtered.filter(item => item.section === 'today') },
      { id: 'upcoming', name: 'Upcoming', items: filtered.filter(item => item.section === 'upcoming') },
      { id: 'goals', name: 'Goals', items: filtered.filter(item => item.type === 'goal') },
    ].filter(section => section.items.length > 0);
  }, [dashboardData, filters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle quick add task
  const handleQuickAdd = useCallback(() => {
    navigation.navigate('TaskCreate');
  }, [navigation]);

  // Render background based on device tier
  const renderBackground = () => {
    if (deviceTier === 'premium' && battery.level > 30) {
      return <SunnyHillsideBackground />;
    }
    if (deviceTier === 'standard') {
      return <StaticBackground />;
    }
    return null;
  };

  // Render item based on type
  const renderItem = (item: any) => {
    switch (item.type) {
      case 'task':
        return (
          <TaskCard
            key={item.id}
            task={item}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            onComplete={() => {
              // Handle task completion
              console.log('Complete task:', item.id);
            }}
            onEdit={() => navigation.navigate('TaskEdit', { taskId: item.id })}
            deviceTier={deviceTier}
          />
        );
      case 'routine':
        return (
          <RoutineCard
            key={item.id}
            routine={item}
            onPress={() => navigation.navigate('RoutineDetail', { routineId: item.id })}
            deviceTier={deviceTier}
          />
        );
      case 'goal':
        return (
          <GoalCard
            key={item.id}
            goal={item}
            onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
            deviceTier={deviceTier}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      {renderBackground()}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Filter Menu */}
        <FilterMenu
          expanded={filterMenuExpanded}
          onToggle={() => setFilterMenuExpanded(!filterMenuExpanded)}
          filters={filters}
          onFiltersChange={setFilters}
          columns={columns}
          onColumnsChange={setColumns}
          deviceTier={deviceTier}
        />

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {filteredSections.map((section) => (
            <View key={section.id} style={styles.section}>
              <SectionHeader
                title={section.name}
                count={section.items.length}
              />
              <View style={[
                styles.cardGrid,
                { 
                  flexDirection: actualColumns === 1 ? 'column' : 'row',
                  flexWrap: actualColumns === 1 ? 'nowrap' : 'wrap',
                }
              ]}>
                {section.items.map(renderItem)}
              </View>
            </View>
          ))}

          {/* Empty state */}
          {filteredSections.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
                No items match your filters
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton
          onPress={handleQuickAdd}
          icon="+"
          deviceTier={deviceTier}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB and tab bar
  },
  section: {
    marginBottom: 32,
  },
  cardGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
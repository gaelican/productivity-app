import React, { useEffect, useState, useCallback, useMemo, Component, ErrorInfo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenProps } from '../../packages/types';
import { getDatabase } from '../../services/database';
import { goalRepository } from '../../services/database/repositories/GoalRepository';
import Goal from '../../services/database/models/Goal';
import GoalCard from '../../components/goals/GoalCard';
import GoalExpandedView from '../../components/goals/GoalExpandedView';
import { Q } from '@nozbe/watermelondb';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

interface GoalListScreenProps extends TabScreenProps<'Goals'> {}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GoalListScreen] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const GoalListScreenComponent: React.FC<GoalListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showExpandedView, setShowExpandedView] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionsGoal, setOptionsGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'categories'>('all');

  // Using state for goals
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsByCategory, setGoalsByCategory] = useState<{ title: string; data: Goal[] }[]>([]);

  // Check database readiness
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        console.log('[GoalListScreen] Checking database readiness...');
        const db = await getDatabase();
        if (db) {
          console.log('[GoalListScreen] Database is ready');
          setDatabaseReady(true);
        }
      } catch (error) {
        console.error('[GoalListScreen] Database check failed:', error);
        setError('Failed to initialize database');
        setLoading(false);
      }
    };

    checkDatabase();
  }, []);

  // Load goals when database is ready
  useEffect(() => {
    if (databaseReady) {
      console.log('[GoalListScreen] Database ready, loading goals...');
      loadGoals();
      setupObservable();
    }
  }, [databaseReady]);

  const setupObservable = async () => {
    try {
      console.log('[GoalListScreen] Setting up observable for user:', DEFAULT_USER_ID);
      const database = await getDatabase();
      const subscription = database.get('goals')
        .query(
          Q.where('user_id', DEFAULT_USER_ID),
          Q.sortBy('priority', Q.desc),
          Q.sortBy('created_at', Q.desc)
        )
        .observe()
        .subscribe(
          (goals) => {
            console.log('[GoalListScreen] Observable update - goals count:', goals.length);
            setGoals(goals as Goal[]);
            organizeByCatagory(goals as Goal[]);
            setLoading(false);
            setError(null);
          },
          (error) => {
            console.error('[GoalListScreen] Observable error:', error);
            setError('Failed to load goals');
            setLoading(false);
          }
        );

      // Store subscription for cleanup
      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('[GoalListScreen] Error setting up observable:', error);
      setError('Failed to setup goal updates');
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      console.log('[GoalListScreen] Loading goals...');
      setLoading(true);
      const userGoals = await goalRepository.getUserGoals(DEFAULT_USER_ID);
      console.log('[GoalListScreen] Loaded goals:', userGoals.length);
      setGoals(userGoals);
      organizeByCatagory(userGoals);
      setError(null);
    } catch (error) {
      console.error('[GoalListScreen] Error loading goals:', error);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const organizeByCatagory = (goals: Goal[]) => {
    const categories = goals.reduce((acc, goal) => {
      const category = goal.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(goal);
      return acc;
    }, {} as Record<string, Goal[]>);

    const sections = Object.entries(categories)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => a.title.localeCompare(b.title));

    setGoalsByCategory(sections);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, []);

  const handleGoalPress = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
    setShowExpandedView(true);
  }, []);

  const handleGoalLongPress = useCallback((goal: Goal) => {
    setOptionsGoal(goal);
    setShowOptions(true);
  }, []);

  const handleQuickIncrement = useCallback(async (goal: Goal) => {
    try {
      await goalRepository.incrementGoalProgress(goal.id, goal.defaultIncrement);
      // No need to reload, observable will update
    } catch (error) {
      console.error('[GoalListScreen] Error incrementing goal:', error);
      Alert.alert('Error', 'Failed to update progress');
    }
  }, []);

  const handleEditGoal = useCallback(() => {
    if (optionsGoal) {
      setShowOptions(false);
      Alert.alert('Edit Goal', 'Edit functionality will be implemented soon');
    }
  }, [optionsGoal]);

  const handleDeleteGoal = useCallback(() => {
    if (optionsGoal) {
      Alert.alert(
        'Delete Goal',
        `Are you sure you want to delete "${optionsGoal.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await goalRepository.deleteGoal(optionsGoal.id);
                setShowOptions(false);
                Alert.alert('Success', 'Goal deleted successfully');
              } catch (error) {
                console.error('Error deleting goal:', error);
                Alert.alert('Error', 'Failed to delete goal');
              }
            },
          },
        ]
      );
    }
  }, [optionsGoal]);

  const handleCreateGoal = useCallback(() => {
    navigation.navigate('GoalCreate');
  }, [navigation]);

  const renderGoalItem = useCallback(({ item }: { item: Goal }) => (
    <GoalCard
      goal={item}
      onPress={() => handleGoalPress(item)}
      onLongPress={() => handleGoalLongPress(item)}
      onQuickIncrement={() => handleQuickIncrement(item)}
    />
  ), [handleGoalPress, handleGoalLongPress, handleQuickIncrement]);

  const keyExtractor = useCallback((item: Goal) => item.id, []);

  const ListHeaderComponent = useMemo(() => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.headerTitle}>Goals</Text>
      <Text style={styles.headerSubtitle}>
        {goals.length} {goals.length === 1 ? 'goal' : 'goals'} • {goals.filter(g => g.status === 'active').length} active
      </Text>
      
      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'all' && styles.viewModeActive]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.viewModeText, viewMode === 'all' && styles.viewModeTextActive]}>
            All Goals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'categories' && styles.viewModeActive]}
          onPress={() => setViewMode('categories')}
        >
          <Text style={[styles.viewModeText, viewMode === 'categories' && styles.viewModeTextActive]}>
            By Category
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [insets.top, goals.length, viewMode]);

  const ListEmptyComponent = useMemo(() => {
    console.log('[GoalListScreen] Rendering ListEmptyComponent, loading:', loading, 'goals:', goals.length, 'error:', error);
    
    if (loading && !databaseReady) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Initializing database...</Text>
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>❌</Text>
          <Text style={styles.emptyStateTitle}>Error</Text>
          <Text style={styles.emptyStateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGoals}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>🎯</Text>
        <Text style={styles.emptyStateTitle}>No goals yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Create your first goal to start tracking progress
        </Text>
      </View>
    );
  }, [loading, goals.length, error, databaseReady]);

  console.log('[GoalListScreen] Main render - goals:', goals.length, 'loading:', loading, 'dbReady:', databaseReady);
  
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />

      {viewMode === 'all' ? (
        <FlatList
          data={goals}
          keyExtractor={keyExtractor}
          renderItem={renderGoalItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            goals.length === 0 && styles.emptyListContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <SectionList
          sections={goalsByCategory}
          keyExtractor={keyExtractor}
          renderItem={renderGoalItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            goalsByCategory.length === 0 && styles.emptyListContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Expanded View Modal */}
      {selectedGoal && (
        <Modal
          visible={showExpandedView}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowExpandedView(false)}
        >
          <GoalExpandedView
            goal={selectedGoal}
            onClose={() => setShowExpandedView(false)}
            onEdit={() => {
              Alert.alert('Edit Goal', 'Edit functionality will be implemented soon');
              setShowExpandedView(false);
            }}
            onViewAnalytics={() => {
              Alert.alert('Goal Analytics', 'Analytics functionality will be implemented soon');
              setShowExpandedView(false);
            }}
          />
        </Modal>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>
              {optionsGoal?.name}
            </Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleEditGoal}
            >
              <Text style={styles.optionIcon}>✏️</Text>
              <Text style={styles.optionText}>Edit Goal</Text>
            </TouchableOpacity>

            {optionsGoal?.status === 'active' && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  goalRepository.archiveGoal(optionsGoal.id);
                  setShowOptions(false);
                }}
              >
                <Text style={styles.optionIcon}>📦</Text>
                <Text style={styles.optionText}>Archive Goal</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.optionButton, styles.optionButtonDanger]}
              onPress={handleDeleteGoal}
            >
              <Text style={styles.optionIcon}>🗑️</Text>
              <Text style={[styles.optionText, styles.optionTextDanger]}>Delete Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.cancelButton]}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleCreateGoal}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>➕</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Wrap with Error Boundary
const GoalListScreenWithBoundary: React.FC<GoalListScreenProps> = (props) => {
  return (
    <ErrorBoundary>
      <GoalListScreenComponent {...props} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeActive: {
    backgroundColor: '#6366F1',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  sectionCount: {
    fontSize: 14,
    color: '#64748B',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  optionButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  optionTextDanger: {
    color: '#DC2626',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 100,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Export both named and default
export const GoalListScreen = GoalListScreenWithBoundary;
export default GoalListScreenWithBoundary;
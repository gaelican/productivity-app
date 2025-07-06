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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenProps } from '../../packages/types';
import { getDatabase } from '../../services/database';
import { routineRepository } from '../../services/database/repositories/RoutineRepository';
import Routine from '../../services/database/models/Routine';
import RoutineCard from '../../components/routines/RoutineCard';
import RoutineExpandedView from '../../components/routines/RoutineExpandedView';
import { Q } from '@nozbe/watermelondb';
import { taskGenerator } from '../../services/TaskGenerator';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

interface RoutineListScreenProps extends TabScreenProps<'Routines'> {}

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
    console.error('[RoutineListScreen] Error caught by boundary:', error, errorInfo);
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

const RoutineListScreenComponent: React.FC<RoutineListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showExpandedView, setShowExpandedView] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionsRoutine, setOptionsRoutine] = useState<Routine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [databaseReady, setDatabaseReady] = useState(false);

  // Using observables for real-time updates
  const [routines, setRoutines] = useState<Routine[]>([]);

  // Check database readiness
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        console.log('[RoutineListScreen] Checking database readiness...');
        const db = await getDatabase();
        if (db) {
          console.log('[RoutineListScreen] Database is ready');
          setDatabaseReady(true);
        }
      } catch (error) {
        console.error('[RoutineListScreen] Database check failed:', error);
        setError('Failed to initialize database');
        setLoading(false);
      }
    };

    checkDatabase();
  }, []);

  // Load routines when database is ready
  useEffect(() => {
    if (databaseReady) {
      console.log('[RoutineListScreen] Database ready, loading routines...');
      loadRoutines();
      setupObservable();
    }
  }, [databaseReady]);

  const setupObservable = async () => {
    try {
      console.log('[RoutineListScreen] Setting up observable for user:', DEFAULT_USER_ID);
      const database = await getDatabase();
      const subscription = database.get('routines')
        .query(
          Q.where('user_id', DEFAULT_USER_ID),
          Q.sortBy('created_at', Q.desc)
        )
        .observe()
        .subscribe(
          (routines) => {
            console.log('[RoutineListScreen] Observable update - routines count:', routines.length);
            routines.forEach((r: any) => console.log('  - Routine:', r.name, r.id));
            setRoutines(routines as Routine[]);
            setLoading(false);
            setError(null);
          },
          (error) => {
            console.error('[RoutineListScreen] Observable error:', error);
            setError('Failed to load routines');
            setLoading(false);
          }
        );

      // Store subscription for cleanup
      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('[RoutineListScreen] Error setting up observable:', error);
      setError('Failed to setup routine updates');
      setLoading(false);
    }
  };

  const loadRoutines = async () => {
    try {
      console.log('[RoutineListScreen] Loading routines...');
      setLoading(true);
      const userRoutines = await routineRepository.getUserRoutines(DEFAULT_USER_ID);
      console.log('[RoutineListScreen] Loaded routines:', userRoutines.length);
      setRoutines(userRoutines);
      setError(null);
    } catch (error) {
      console.error('[RoutineListScreen] Error loading routines:', error);
      setError('Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  }, []);

  const handleRoutinePress = useCallback((routine: Routine) => {
    setSelectedRoutine(routine);
    setShowExpandedView(true);
  }, []);

  const handleRoutineLongPress = useCallback((routine: Routine) => {
    setOptionsRoutine(routine);
    setShowOptions(true);
  }, []);

  const handleEditRoutine = useCallback(() => {
    if (optionsRoutine) {
      setShowOptions(false);
      Alert.alert('Edit Routine', 'Edit functionality will be implemented soon');
    }
  }, [optionsRoutine]);

  const handleDeleteRoutine = useCallback(() => {
    if (optionsRoutine) {
      Alert.alert(
        'Delete Routine',
        `Are you sure you want to delete "${optionsRoutine.name}"? This will also delete all associated tasks.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await routineRepository.deleteRoutine(optionsRoutine.id);
                setShowOptions(false);
                Alert.alert('Success', 'Routine deleted successfully');
              } catch (error) {
                console.error('Error deleting routine:', error);
                Alert.alert('Error', 'Failed to delete routine');
              }
            },
          },
        ]
      );
    }
  }, [optionsRoutine]);

  const handleCreateRoutine = useCallback(() => {
    navigation.navigate('RoutineCreate');
  }, [navigation]);

  const renderRoutineItem = useCallback(({ item }: { item: Routine }) => (
    <RoutineCard
      routine={item}
      onPress={() => handleRoutinePress(item)}
      onLongPress={() => handleRoutineLongPress(item)}
    />
  ), [handleRoutinePress, handleRoutineLongPress]);

  const keyExtractor = useCallback((item: Routine) => item.id, []);

  const ListHeaderComponent = useMemo(() => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.headerTitle}>Routines</Text>
      <Text style={styles.headerSubtitle}>
        {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
      </Text>
    </View>
  ), [insets.top, routines.length]);

  const ListEmptyComponent = useMemo(() => {
    console.log('[RoutineListScreen] Rendering ListEmptyComponent, loading:', loading, 'routines:', routines.length, 'error:', error);
    
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
          <Text style={styles.loadingText}>Loading routines...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>❌</Text>
          <Text style={styles.emptyStateTitle}>Error</Text>
          <Text style={styles.emptyStateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRoutines}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>🎯</Text>
        <Text style={styles.emptyStateTitle}>No routines yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Create your first routine to build consistent habits
        </Text>
      </View>
    );
  }, [loading, routines.length, error, databaseReady]);

  console.log('[RoutineListScreen] Main render - routines:', routines.length, 'loading:', loading, 'dbReady:', databaseReady);
  
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />

      {/* Routines List */}
      <FlatList
        data={routines}
        keyExtractor={keyExtractor}
        renderItem={renderRoutineItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          routines.length === 0 && styles.emptyListContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Expanded View Modal */}
      {selectedRoutine && (
        <Modal
          visible={showExpandedView}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowExpandedView(false)}
        >
          <RoutineExpandedView
            routine={selectedRoutine}
            onClose={() => setShowExpandedView(false)}
            onStartRoutine={async () => {
              try {
                setShowExpandedView(false);
                
                // Generate tasks from routine
                const result = await taskGenerator.generateTasksFromRoutine(selectedRoutine);
                
                if (result.errors.length > 0) {
                  Alert.alert(
                    'Partial Success',
                    `Created ${result.tasksCreated} tasks.\nErrors: ${result.errors.join('\n')}`
                  );
                } else {
                  Alert.alert(
                    'Success',
                    `Created ${result.tasksCreated} tasks from routine!`,
                    [
                      {
                        text: 'View Tasks',
                        onPress: () => navigation.navigate('Dashboard'),
                      },
                      { text: 'OK' },
                    ]
                  );
                }
              } catch (error) {
                console.error('Error starting routine:', error);
                Alert.alert('Error', 'Failed to start routine. Please try again.');
              }
            }}
            onConfigure={() => {
              Alert.alert('Configure Routine', 'Configuration functionality will be implemented soon');
              setShowExpandedView(false);
            }}
            onAnalytics={() => {
              Alert.alert('Routine Analytics', 'Analytics functionality will be implemented soon');
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
              {optionsRoutine?.name}
            </Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleEditRoutine}
            >
              <Text style={styles.optionIcon}>✏️</Text>
              <Text style={styles.optionText}>Edit Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.optionButtonDanger]}
              onPress={handleDeleteRoutine}
            >
              <Text style={styles.optionIcon}>🗑️</Text>
              <Text style={[styles.optionText, styles.optionTextDanger]}>Delete Routine</Text>
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
        onPress={handleCreateRoutine}
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
const RoutineListScreenWithBoundary: React.FC<RoutineListScreenProps> = (props) => {
  return (
    <ErrorBoundary>
      <RoutineListScreenComponent {...props} />
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
  },
  listContent: {
    paddingTop: 16,
  },
  emptyListContent: {
    flex: 1,
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
export const RoutineListScreen = RoutineListScreenWithBoundary;
export default RoutineListScreenWithBoundary;
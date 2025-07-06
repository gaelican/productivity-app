import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDatabase } from '../../services/database';
import { taskRepository } from '../../services/database/repositories/TaskRepository';
import Task from '../../services/database/models/Task';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import { Observable } from '@nozbe/watermelondb/utils/rx';
import { TaskExpandedView } from '../../components/tasks/TaskExpandedView';
import { TaskCard } from '../../core/tasks/TaskCard';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

type SortOption = 'priority' | 'dueDate' | 'name' | 'createdAt';
type FilterOption = 'all' | 'active' | 'completed' | 'overdue' | 'today';

interface TaskListScreenProps {
  navigation?: any; // Navigation can be passed if needed
  tasks: Task[];
}

const TaskListScreenComponent: React.FC<TaskListScreenProps> = ({ navigation, tasks }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterBy, setFilterBy] = useState<FilterOption>('active');
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply filter
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(task => !task.isCompleted);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.isCompleted);
        break;
      case 'overdue':
        filtered = filtered.filter(task => task.isOverdue);
        break;
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          return task.dueDate >= todayStart.getTime() && task.dueDate <= todayEnd.getTime();
        });
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort tasks
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate - b.dueDate;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, filterBy, searchQuery, sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refreshing is handled by observables
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleTaskPress = useCallback((task: Task) => {
    if (isSelectionMode) {
      toggleTaskSelection(task.id);
    } else {
      setExpandedTask(task);
    }
  }, [isSelectionMode]);

  const handleTaskLongPress = useCallback((task: Task) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedTasks(new Set([task.id]));
    }
  }, [isSelectionMode]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleCompleteSelected = async () => {
    for (const taskId of selectedTasks) {
      const task = tasks.find(t => t.id === taskId);
      if (task && !task.isCompleted) {
        await task.complete();
      }
    }
    setIsSelectionMode(false);
    setSelectedTasks(new Set());
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      'Delete Tasks',
      `Are you sure you want to delete ${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const taskId of selectedTasks) {
                await taskRepository.delete(taskId);
              }
              setIsSelectionMode(false);
              setSelectedTasks(new Set());
            } catch (error) {
              console.error('Error deleting tasks:', error);
            }
          },
        },
      ]
    );
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedTasks(new Set());
  };

  const handleTaskEdit = (task: Task) => {
    navigation?.getParent()?.navigate('TaskEdit', { taskId: task.id });
  };

  const handleTaskDeleted = (task: Task) => {
    // Task list will auto-update via observables
    console.log('Task deleted:', task.name);
  };

  const renderTask = ({ item: task }: { item: Task }) => {
    const isSelected = selectedTasks.has(task.id);

    // Convert database task to match TaskCard expected format
    const taskForCard = {
      id: task.id,
      name: task.name,
      description: task.description,
      notes: task.notes,
      icon: task.icon,
      color: task.color,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      dueTime: task.dueTime,
      isCompleted: task.isCompleted,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      progress: task.progress,
      tags: task.tags,
      parsedInput: task.parsedInput,
      userId: task.userId,
      goalId: task.goalId,
      routineId: task.routineId,
      parentTaskId: task.parentTaskId,
      deviceId: task.deviceId,
      version: task.version,
      syncStatus: task.syncStatus,
      lastSyncedAt: task.lastSyncedAt ? new Date(task.lastSyncedAt) : undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    return (
      <View style={[styles.taskWrapper, isSelected && styles.taskWrapperSelected]}>
        <TouchableOpacity
          onLongPress={() => handleTaskLongPress(task)}
          activeOpacity={0.95}
          style={styles.touchableWrapper}
        >
          <TaskCard
            task={taskForCard}
            onPress={() => handleTaskPress(task)}
            onComplete={async () => {
              if (!task.isCompleted) {
                await task.complete();
              }
            }}
            onEdit={() => handleTaskEdit(task)}
          />
        </TouchableOpacity>
        {isSelectionMode && (
          <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlayActive]}>
            <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tasks</Text>
          {isSelectionMode ? (
            <TouchableOpacity onPress={exitSelectionMode}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation?.navigate('TaskCreate')}>
              <Text style={styles.createButton}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Bar */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {(['all', 'active', 'completed', 'overdue', 'today'] as FilterOption[]).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, filterBy === filter && styles.filterChipActive]}
              onPress={() => setFilterBy(filter)}
            >
              <Text style={[styles.filterChipText, filterBy === filter && styles.filterChipTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortButtonText}>⇅ Sort</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Task List */}
      <FlatList
        data={processedTasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateTitle}>No tasks found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery ? 'Try a different search' : 'Create your first task'}
            </Text>
          </View>
        }
      />

      {/* Selection Actions */}
      {isSelectionMode && selectedTasks.size > 0 && (
        <View style={[styles.selectionActions, { bottom: insets.bottom + 80 }]}>
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.selectionActionsGradient}
          >
            <Text style={styles.selectionCount}>
              {selectedTasks.size} selected
            </Text>
            <View style={styles.selectionButtons}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleCompleteSelected}
              >
                <Text style={styles.selectionButtonText}>✓ Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleDeleteSelected}
              >
                <Text style={styles.selectionButtonText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort by</Text>
            {(['priority', 'dueDate', 'name', 'createdAt'] as SortOption[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy(option);
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionTextActive]}>
                  {option === 'dueDate' ? 'Due Date' : 
                   option === 'createdAt' ? 'Created Date' :
                   option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                {sortBy === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Task Expanded View */}
      {expandedTask && (
        <TaskExpandedView
          task={expandedTask}
          visible={!!expandedTask}
          onClose={() => setExpandedTask(null)}
          onEdit={handleTaskEdit}
          onDelete={handleTaskDeleted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  cancelText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  createButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearIcon: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  filterBar: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterBarContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 16,
  },
  taskWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  taskWrapperSelected: {
    transform: [{ scale: 0.98 }],
  },
  touchableWrapper: {
    flex: 1,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    right: 16,
    bottom: 0,
    justifyContent: 'center',
    paddingRight: 16,
  },
  selectionOverlayActive: {
    // Style for when selected
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  selectionIndicatorActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
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
  },
  selectionActions: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  selectionActionsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  selectionCount: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  selectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  selectionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortOptionActive: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#475569',
  },
  sortOptionTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#6366F1',
  },
});

// Enhanced component with observables
const enhance = withObservables(['navigation'], async () => {
  const database = await getDatabase();
  
  return {
    tasks: database.get('tasks')
      .query(
        Q.where('user_id', DEFAULT_USER_ID)
      )
      .observeWithColumns(['is_completed', 'name', 'priority', 'due_date']) as Observable<Task[]>,
  };
});

export const TaskListScreen = enhance(TaskListScreenComponent);
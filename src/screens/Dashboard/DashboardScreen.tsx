import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenProps } from '../../packages/types';
import { getDatabase } from '../../services/database';
import { taskRepository } from '../../services/database/repositories/TaskRepository';
import { Task } from '../../packages/types';
import { TaskParser, ParsedTask } from '../../core/tasks/parser';
import { GradientThemeManager, GradientTheme } from '../../core/tasks/gradients';
import { goalRepository } from '../../services/database/repositories/GoalRepository';
import { Goal } from '../../packages/types';
import { TaskExpandedViewDirect } from '../../components/tasks/TaskExpandedViewDirect';
import { TaskListScreen } from '../Tasks/TaskListScreen';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

interface DashboardScreenProps extends TabScreenProps<'Dashboard'> {}

const DashboardScreenComponent: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [selectedGradient, setSelectedGradient] = useState<GradientTheme>(GradientThemeManager.getGradientById('ocean')!);
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [showTaskList, setShowTaskList] = useState(false);
  const taskParser = new TaskParser();

  // Load tasks and goals on mount
  useEffect(() => {
    loadTasks();
    loadGoals();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const activeTasks = await taskRepository.getActiveTasks(DEFAULT_USER_ID);
      const completedTasks = await taskRepository.getCompletedTasks(DEFAULT_USER_ID, 5); // Limit completed tasks
      setTasks([...activeTasks, ...completedTasks]);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const activeGoals = await goalRepository.getUserGoals(DEFAULT_USER_ID);
      setGoals(activeGoals.filter(g => g.status === 'active'));
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTasks(), loadGoals()]);
    setRefreshing(false);
  }, []);

  const handleTaskPress = (task: Task) => {
    setExpandedTask(task);
  };

  const handleTaskComplete = async (task: Task) => {
    try {
      await taskRepository.toggleCompletion(task.id);
      // Reload tasks to get updated data
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleTaskEdit = (task: Task) => {
    navigation.getParent()?.navigate('TaskEdit', { taskId: task.id });
  };

  const handleTaskDeleted = (task: Task) => {
    // Reload tasks after deletion
    loadTasks();
  };

  const handleQuickAddChange = (text: string) => {
    setQuickAddText(text);
    if (text.trim()) {
      const parsed = taskParser.parse(text);
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
    }
  };

  const handleCreateTask = async () => {
    if (parsedTask && quickAddText.trim()) {
      try {
        setLoading(true);
        
        // Create task in database
        await taskRepository.create({
          name: parsedTask.title,
          icon: parsedTask.suggestedIcon || '📌',
          color: selectedGradient.id,
          priority: parsedTask.priority,
          dueDate: parsedTask.dueDate?.getTime(),
          dueTime: parsedTask.dueTime,
          userId: DEFAULT_USER_ID,
          goalId: selectedGoalId || undefined,
          tags: [],
          parsedInput: quickAddText,
        });
        
        // Reload tasks to show the new one
        await loadTasks();
        
        // Reset form
        setShowQuickAdd(false);
        setQuickAddText('');
        setParsedTask(null);
        setSelectedGoalId(null);
      } catch (error) {
        console.error('Error creating task:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const incompleteTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {incompleteTasks.length} active tasks
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setShowTaskList(true)}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Add Button */}
      <TouchableOpacity
        style={styles.quickAddButton}
        activeOpacity={0.8}
        onPress={() => setShowQuickAdd(true)}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.quickAddGradient}
        >
          <Text style={styles.quickAddIcon}>➕</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Add Modal */}
      <Modal
        visible={showQuickAdd}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuickAdd(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickAdd(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Quick Add Task</Text>
            <TextInput
              style={styles.quickAddInput}
              placeholder="e.g., Buy milk tomorrow 5pm"
              value={quickAddText}
              onChangeText={handleQuickAddChange}
              autoFocus={true}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleCreateTask}
            />
            
            {/* Parsed Task Preview */}
            {parsedTask && (
              <View style={styles.parsedPreview}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewIcon}>{parsedTask.suggestedIcon}</Text>
                  <Text style={styles.previewTitle}>{parsedTask.title}</Text>
                </View>
                {parsedTask.dueDate && (
                  <Text style={styles.previewDetail}>
                    📅 {parsedTask.parsedElements.dateText}
                    {parsedTask.dueTime && ` at ${parsedTask.dueTime}`}
                  </Text>
                )}
                {parsedTask.parsedElements.priorityText && (
                  <Text style={styles.previewDetail}>
                    ⚡ Priority: {parsedTask.priority}
                  </Text>
                )}
              </View>
            )}

            {/* Gradient Selection */}
            <View style={styles.gradientSection}>
              <Text style={styles.gradientLabel}>Color Theme:</Text>
              <TouchableOpacity
                style={styles.gradientSelector}
                onPress={() => setShowGradientPicker(!showGradientPicker)}
              >
                <LinearGradient
                  colors={selectedGradient.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientPreview}
                />
                <Text style={styles.gradientName}>{selectedGradient.name}</Text>
                <Text style={styles.gradientArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Gradient Picker Grid */}
            {showGradientPicker && (
              <ScrollView 
                style={styles.gradientPicker}
                horizontal={false}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.gradientGrid}>
                  {GradientThemeManager.getAllGradients().map((gradient) => (
                    <TouchableOpacity
                      key={gradient.id}
                      style={styles.gradientOption}
                      onPress={() => {
                        setSelectedGradient(gradient);
                        setShowGradientPicker(false);
                      }}
                    >
                      <LinearGradient
                        colors={gradient.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.gradientOptionPreview,
                          selectedGradient.id === gradient.id && styles.gradientOptionSelected
                        ]}
                      />
                      <Text style={styles.gradientOptionName}>{gradient.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Goal Selection */}
            {goals.length > 0 && (
              <View style={styles.goalSection}>
                <Text style={styles.goalLabel}>Link to Goal (Optional)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.goalScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.goalOption,
                      selectedGoalId === null && styles.goalOptionSelected,
                    ]}
                    onPress={() => setSelectedGoalId(null)}
                  >
                    <Text style={styles.goalOptionIcon}>❌</Text>
                    <Text style={[
                      styles.goalOptionText,
                      selectedGoalId === null && styles.goalOptionTextSelected,
                    ]}>
                      No Goal
                    </Text>
                  </TouchableOpacity>
                  {goals.map(goal => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.goalOption,
                        selectedGoalId === goal.id && styles.goalOptionSelected,
                      ]}
                      onPress={() => setSelectedGoalId(goal.id)}
                    >
                      <Text style={styles.goalOptionIcon}>{goal.icon || '🎯'}</Text>
                      <Text style={[
                        styles.goalOptionText,
                        selectedGoalId === goal.id && styles.goalOptionTextSelected,
                      ]}>
                        {goal.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowQuickAdd(false);
                  setQuickAddText('');
                  setParsedTask(null);
                  setSelectedGoalId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !quickAddText.trim() && styles.createButtonDisabled]}
                onPress={handleCreateTask}
                disabled={!quickAddText.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Tasks ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <>
            {/* Active Tasks Section */}
            {incompleteTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Tasks</Text>
                {incompleteTasks.map(task => {
                  const gradient = GradientThemeManager.getGradientById(task.color);
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => handleTaskPress(task)}
                      onLongPress={() => handleTaskComplete(task)}
                    >
                      <LinearGradient
                        colors={gradient?.colors || ['#2E86AB', '#3B5F8A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.taskGradient}
                      >
                        <Text style={styles.taskIcon}>{task.icon}</Text>
                        <Text style={[styles.taskTitle, { color: gradient?.textColor || '#FFFFFF' }]}>
                          {task.name}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed</Text>
                {completedTasks.map(task => {
                  const gradient = GradientThemeManager.getGradientById(task.color);
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => handleTaskPress(task)}
                      onLongPress={() => handleTaskComplete(task)}
                    >
                      <LinearGradient
                        colors={gradient?.colors || ['#2E86AB', '#3B5F8A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.taskGradient, styles.taskCompletedGradient]}
                      >
                        <Text style={styles.taskIcon}>{task.icon}</Text>
                        <Text style={[styles.taskTitle, styles.taskCompleted, { color: gradient?.textColor || '#FFFFFF' }]}>
                          {task.name}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Empty State */}
            {tasks.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🎯</Text>
                <Text style={styles.emptyStateTitle}>No tasks yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Tap the + button to create your first task
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Task Expanded View */}
      {expandedTask && (
        <TaskExpandedViewDirect
          task={expandedTask}
          visible={!!expandedTask}
          onClose={() => setExpandedTask(null)}
          onEdit={handleTaskEdit}
          onDelete={handleTaskDeleted}
        />
      )}

      {/* Task List Modal */}
      <Modal
        visible={showTaskList}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowTaskList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTaskList(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>All Tasks</Text>
            <View style={styles.modalCloseButton} />
          </View>
          <TaskListScreen navigation={navigation} route={{ key: 'Tasks', name: 'Tasks', params: undefined }} />
        </View>
      </Modal>
    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  quickAddButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 100,
  },
  quickAddGradient: {
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
  quickAddIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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
  taskItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  taskGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCompletedGradient: {
    opacity: 0.7,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickAddInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  parsedPreview: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  previewTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  previewDetail: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gradientSection: {
    marginBottom: 16,
  },
  gradientLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  gradientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
  },
  gradientPreview: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
  },
  gradientName: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  gradientArrow: {
    fontSize: 12,
    color: '#64748B',
  },
  gradientPicker: {
    maxHeight: 200,
    marginBottom: 16,
    marginTop: -8,
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  gradientOption: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradientOptionPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
  },
  gradientOptionSelected: {
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  gradientOptionName: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  goalSection: {
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  goalScroll: {
    maxHeight: 60,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  goalOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  goalOptionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  goalOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#64748B',
  },
});

// Export the component without observables for now
export const DashboardScreen = DashboardScreenComponent;
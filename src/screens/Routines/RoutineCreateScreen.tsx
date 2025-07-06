import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../packages/types';
import { routineRepository } from '../../services/database/repositories/RoutineRepository';
import { GradientThemeManager, GradientTheme } from '../../core/tasks/gradients';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

type RoutineCreateScreenProps = StackScreenProps<RootStackParamList, 'RoutineCreate'>;

interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  estimatedDuration: number;
  order: number;
  dependsOn?: string[]; // IDs of tasks that must be completed first
}

interface ScheduleDay {
  name: string;
  short: string;
  selected: boolean;
}

export const RoutineCreateScreen: React.FC<RoutineCreateScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔄');
  const [selectedGradient, setSelectedGradient] = useState<GradientTheme>(
    GradientThemeManager.getGradientById('ocean')!
  );
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Step 2: Task Templates
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskIcon, setNewTaskIcon] = useState('📌');
  const [newTaskDuration, setNewTaskDuration] = useState('5');
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [showDependencyModal, setShowDependencyModal] = useState(false);

  // Step 3: Schedule
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([
    { name: 'Monday', short: 'Mon', selected: true },
    { name: 'Tuesday', short: 'Tue', selected: true },
    { name: 'Wednesday', short: 'Wed', selected: true },
    { name: 'Thursday', short: 'Thu', selected: true },
    { name: 'Friday', short: 'Fri', selected: true },
    { name: 'Saturday', short: 'Sat', selected: false },
    { name: 'Sunday', short: 'Sun', selected: false },
  ]);
  const [preferredTime, setPreferredTime] = useState('08:00');
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  // Common icons for selection
  const commonIcons = ['🔄', '🏃', '🧘', '📚', '💪', '🎯', '☕', '🛏️', '🏠', '💻', '🚿', '🍳'];

  // Calculate total duration when tasks change
  React.useEffect(() => {
    const total = taskTemplates.reduce((sum, task) => sum + task.estimatedDuration, 0);
    setEstimatedDuration(total);
  }, [taskTemplates]);

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    
    const newTask: TaskTemplate = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      icon: newTaskIcon,
      estimatedDuration: parseInt(newTaskDuration) || 5,
      order: taskTemplates.length,
      dependsOn: [],
    };
    
    setTaskTemplates([...taskTemplates, newTask]);
    setNewTaskName('');
    setNewTaskIcon('📌');
    setNewTaskDuration('5');
    setShowAddTask(false);
  };

  const handleEditDependencies = (task: TaskTemplate) => {
    setEditingTask(task);
    setShowDependencyModal(true);
  };

  const toggleDependency = (taskId: string, dependencyId: string) => {
    setTaskTemplates(taskTemplates.map(task => {
      if (task.id === taskId) {
        const currentDeps = task.dependsOn || [];
        const updatedDeps = currentDeps.includes(dependencyId)
          ? currentDeps.filter(id => id !== dependencyId)
          : [...currentDeps, dependencyId];
        return { ...task, dependsOn: updatedDeps };
      }
      return task;
    }));
  };

  const getTaskDependencies = (taskId: string): string[] => {
    const task = taskTemplates.find(t => t.id === taskId);
    return task?.dependsOn || [];
  };

  const canTaskDependOn = (taskId: string, potentialDependencyId: string): boolean => {
    // Prevent circular dependencies
    if (taskId === potentialDependencyId) return false;
    
    // Check if adding this dependency would create a cycle
    const visited = new Set<string>();
    const checkCycle = (currentId: string): boolean => {
      if (visited.has(currentId)) return true;
      if (currentId === taskId) return true;
      visited.add(currentId);
      
      const task = taskTemplates.find(t => t.id === currentId);
      if (task?.dependsOn) {
        for (const depId of task.dependsOn) {
          if (checkCycle(depId)) return true;
        }
      }
      return false;
    };
    
    return !checkCycle(potentialDependencyId);
  };

  const handleRemoveTask = (taskId: string) => {
    setTaskTemplates(taskTemplates.filter(task => task.id !== taskId));
  };

  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    const index = taskTemplates.findIndex(task => task.id === taskId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= taskTemplates.length) return;
    
    const newTasks = [...taskTemplates];
    [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
    newTasks.forEach((task, i) => { task.order = i; });
    setTaskTemplates(newTasks);
  };

  const toggleDay = (index: number) => {
    const newDays = [...scheduleDays];
    newDays[index].selected = !newDays[index].selected;
    setScheduleDays(newDays);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return taskTemplates.length > 0;
      case 2:
        return scheduleDays.some(day => day.selected);
      default:
        return false;
    }
  };

  const handleCreateRoutine = async () => {
    if (!canProceed()) return;
    
    try {
      setLoading(true);
      
      // Create schedule config object
      const scheduleConfig = {
        days: scheduleDays
          .filter(day => day.selected)
          .map((_, index) => index + 1), // 1-7 for Monday-Sunday
        time: preferredTime,
      };
      
      // Create routine
      await routineRepository.createRoutine({
        name,
        description,
        icon,
        color: selectedGradient.id,
        scheduleType: 'weekly', // Default to weekly since we're using days
        scheduleConfig,
        taskTemplates,
        userId: DEFAULT_USER_ID,
      });
      
      Alert.alert(
        'Success',
        'Routine created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Basic Info', 'Tasks', 'Schedule'].map((step, index) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                index <= currentStep && styles.stepNumberActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              index <= currentStep && styles.stepLabelActive,
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Routine Name</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Morning Routine"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this routine for?"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Icon Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Icon</Text>
        <TouchableOpacity
          style={styles.iconSelector}
          onPress={() => setShowIconPicker(!showIconPicker)}
        >
          <Text style={styles.selectedIcon}>{icon}</Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
        
        {showIconPicker && (
          <View style={styles.iconGrid}>
            {commonIcons.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.iconOption,
                  icon === emoji && styles.iconOptionSelected,
                ]}
                onPress={() => {
                  setIcon(emoji);
                  setShowIconPicker(false);
                }}
              >
                <Text style={styles.iconOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Gradient Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Color Theme</Text>
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
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Gradient Picker Modal */}
      <Modal
        visible={showGradientPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGradientPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGradientPicker(false)}
        >
          <TouchableOpacity
            style={styles.gradientPickerModal}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Select Color Theme</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gradientGrid}
            >
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
                      selectedGradient.id === gradient.id && styles.gradientOptionSelected,
                    ]}
                  />
                  <Text style={styles.gradientOptionName}>{gradient.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderTaskTemplates = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Add Tasks to Your Routine</Text>
      <Text style={styles.stepSubtitle}>
        These tasks will be created when you activate this routine
      </Text>

      {/* Task List */}
      {taskTemplates.length > 0 && (
        <View style={styles.taskList}>
          {taskTemplates.map((task, index) => (
            <View key={task.id} style={styles.taskItem}>
              <Text style={styles.taskIcon}>{task.icon}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskDuration}>{task.estimatedDuration} min</Text>
                {task.dependsOn && task.dependsOn.length > 0 && (
                  <Text style={styles.taskDependency}>
                    Depends on: {task.dependsOn.map(depId => 
                      taskTemplates.find(t => t.id === depId)?.name
                    ).filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  onPress={() => handleEditDependencies(task)}
                  style={styles.taskActionButton}
                >
                  <Text style={styles.taskActionText}>🔗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMoveTask(task.id, 'up')}
                  disabled={index === 0}
                  style={[styles.taskActionButton, index === 0 && styles.taskActionDisabled]}
                >
                  <Text style={styles.taskActionText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMoveTask(task.id, 'down')}
                  disabled={index === taskTemplates.length - 1}
                  style={[styles.taskActionButton, index === taskTemplates.length - 1 && styles.taskActionDisabled]}
                >
                  <Text style={styles.taskActionText}>↓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemoveTask(task.id)}
                  style={styles.taskActionButton}
                >
                  <Text style={[styles.taskActionText, { color: '#EF4444' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Text style={styles.totalDuration}>
            Total duration: {estimatedDuration} minutes
          </Text>
        </View>
      )}

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addTaskButton}
        onPress={() => setShowAddTask(true)}
      >
        <Text style={styles.addTaskIcon}>➕</Text>
        <Text style={styles.addTaskText}>Add Task</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTask}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddTask(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddTask(false)}
        >
          <TouchableOpacity
            style={styles.addTaskModal}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Add Task</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Name</Text>
              <TextInput
                style={styles.textInput}
                value={newTaskName}
                onChangeText={setNewTaskName}
                placeholder="e.g., Brush teeth"
                placeholderTextColor="#94A3B8"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.iconScroll}
              >
                {commonIcons.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.iconOption,
                      newTaskIcon === emoji && styles.iconOptionSelected,
                    ]}
                    onPress={() => setNewTaskIcon(emoji)}
                  >
                    <Text style={styles.iconOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={newTaskDuration}
                onChangeText={setNewTaskDuration}
                placeholder="5"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddTask(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !newTaskName.trim() && styles.createButtonDisabled]}
                onPress={handleAddTask}
                disabled={!newTaskName.trim()}
              >
                <Text style={styles.createButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Set Your Schedule</Text>
      
      {/* Days Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Days</Text>
        <View style={styles.daysGrid}>
          {scheduleDays.map((day, index) => (
            <TouchableOpacity
              key={day.name}
              style={[
                styles.dayOption,
                day.selected && styles.dayOptionSelected,
              ]}
              onPress={() => toggleDay(index)}
            >
              <Text
                style={[
                  styles.dayOptionText,
                  day.selected && styles.dayOptionTextSelected,
                ]}
              >
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferred Time */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Preferred Time</Text>
        <TextInput
          style={styles.textInput}
          value={preferredTime}
          onChangeText={setPreferredTime}
          placeholder="08:00"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.inputHint}>
          Format: HH:MM (24-hour format)
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Routine Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{name || 'Not set'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tasks:</Text>
          <Text style={styles.summaryValue}>{taskTemplates.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{estimatedDuration} minutes</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Schedule:</Text>
          <Text style={styles.summaryValue}>
            {scheduleDays.filter(d => d.selected).length} days/week at {preferredTime}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderTaskTemplates();
      case 2:
        return renderSchedule();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Routine</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <View style={[styles.navigationButtons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        {currentStep < 2 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary, !canProceed() && styles.navButtonDisabled]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary, (!canProceed() || loading) && styles.navButtonDisabled]}
            onPress={handleCreateRoutine}
            disabled={!canProceed() || loading}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {loading ? 'Creating...' : 'Create Routine'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dependency Modal */}
      <Modal
        visible={showDependencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDependencyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDependencyModal(false)}
        >
          <TouchableOpacity
            style={styles.dependencyModal}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Manage Dependencies</Text>
            {editingTask && (
              <>
                <Text style={styles.dependencySubtitle}>
                  Select which tasks must be completed before "{editingTask.name}"
                </Text>
                
                <ScrollView
                  style={styles.dependencyList}
                  showsVerticalScrollIndicator={false}
                >
                  {taskTemplates
                    .filter(task => task.id !== editingTask.id && canTaskDependOn(editingTask.id, task.id))
                    .map(task => {
                      const isSelected = editingTask.dependsOn?.includes(task.id) || false;
                      return (
                        <TouchableOpacity
                          key={task.id}
                          style={[
                            styles.dependencyOption,
                            isSelected && styles.dependencyOptionSelected,
                          ]}
                          onPress={() => toggleDependency(editingTask.id, task.id)}
                        >
                          <View style={styles.dependencyCheckbox}>
                            {isSelected && <Text style={styles.dependencyCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.dependencyTaskIcon}>{task.icon}</Text>
                          <Text style={[
                            styles.dependencyTaskName,
                            isSelected && styles.dependencyTaskNameSelected,
                          ]}>
                            {task.name}
                          </Text>
                          <Text style={styles.dependencyTaskDuration}>
                            {task.estimatedDuration} min
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
                
                {editingTask.dependsOn && editingTask.dependsOn.length > 0 && (
                  <View style={styles.dependencySummary}>
                    <Text style={styles.dependencySummaryTitle}>Dependencies:</Text>
                    <Text style={styles.dependencySummaryText}>
                      This task will be created after: {editingTask.dependsOn
                        .map(depId => taskTemplates.find(t => t.id === depId)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowDependencyModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#6366F1',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepContent: {
    minHeight: 400,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectorArrow: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 'auto',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  iconScroll: {
    maxHeight: 60,
  },
  iconOption: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  iconOptionSelected: {
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  iconOptionText: {
    fontSize: 24,
  },
  gradientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientPickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gradientOption: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradientOptionPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
  },
  gradientOptionSelected: {
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  gradientOptionName: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  taskList: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskDuration: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskActionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  taskActionDisabled: {
    opacity: 0.4,
  },
  taskActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  totalDuration: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addTaskIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addTaskText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  addTaskModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dayOptionSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  dayOptionTextSelected: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
  navButtonTextDisabled: {
    color: '#94A3B8',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
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
  taskDependency: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  dependencyModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  dependencySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  dependencyList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  dependencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dependencyOptionSelected: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  dependencyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dependencyCheckmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  dependencyTaskIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dependencyTaskName: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  dependencyTaskNameSelected: {
    fontWeight: '600',
    color: '#6366F1',
  },
  dependencyTaskDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  dependencySummary: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dependencySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  dependencySummaryText: {
    fontSize: 14,
    color: '#0284C7',
  },
  doneButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
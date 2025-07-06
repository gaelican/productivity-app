import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../../navigation/types';
import { taskRepository } from '../../services/database/repositories/TaskRepository';
import { TaskForm, TaskFormData } from '../../components/tasks';
import Task from '../../services/database/models/Task';

type TaskEditScreenProps = RootStackScreenProps<'TaskEdit'>;

export const TaskEditScreen: React.FC<TaskEditScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { taskId } = route.params;
  
  // Task state
  const [task, setTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load task data
  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const loadedTask = await taskRepository.findById(taskId);
      if (loadedTask) {
        setTask(loadedTask);
      } else {
        Alert.alert('Error', 'Task not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task');
      navigation.goBack();
    } finally {
      setLoadingTask(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (formData: TaskFormData) => {
    if (!task) return;

    try {
      setSaving(true);
      
      await taskRepository.update(taskId, {
        name: formData.name,
        description: formData.description,
        notes: formData.notes,
        icon: formData.icon,
        color: formData.color,
        priority: formData.priority,
        dueDate: formData.dueDate?.getTime(),
        tags: formData.tags,
        progress: formData.progress,
        goalId: formData.goalId,
      });
      
      // Show success feedback
      Alert.alert('Success', 'Task updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle task completion
  const handleToggleComplete = async () => {
    if (!task || saving) return;
    
    try {
      setSaving(true);
      
      if (task.isCompleted) {
        await task.uncomplete();
      } else {
        await task.complete();
      }
      
      // Reload task to get updated state
      await loadTask();
      
      // Show success feedback
      const message = task.isCompleted ? 'Task marked as incomplete' : 'Task marked as complete';
      Alert.alert('Success', message);
    } catch (error) {
      console.error('Error toggling completion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task status';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle task deletion
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await taskRepository.delete(taskId);
              Alert.alert('Success', 'Task deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting task:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
              Alert.alert('Error', errorMessage);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loadingTask) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE', '#BAE6FD']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!task) {
    return null;
  }

  // Prepare initial values for the form
  const initialValues: Partial<TaskFormData> = {
    name: task.name,
    description: task.description,
    notes: task.notes,
    icon: task.icon,
    color: task.color,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    dueTime: task.dueTime,
    tags: task.tags || [],
    goalId: task.goalId,
    progress: task.progress,
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <TouchableOpacity onPress={handleDelete} disabled={saving}>
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Task Status Card */}
      <View style={styles.statusCard}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            task.isCompleted && styles.statusButtonCompleted,
          ]}
          onPress={handleToggleComplete}
          disabled={saving}
        >
          <Text style={[
            styles.statusButtonText,
            task.isCompleted && styles.statusButtonTextCompleted,
          ]}>
            {task.isCompleted ? '✓ Completed' : '○ Mark as Complete'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task Form */}
      <TaskForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={saving}
      />

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          Created {new Date(task.createdAt).toLocaleDateString()}
        </Text>
        {task.completedAt && (
          <Text style={styles.metadataText}>
            Completed {new Date(task.completedAt).toLocaleDateString()}
          </Text>
        )}
        {task.parsedInput && (
          <Text style={styles.metadataText}>
            Original: "{task.parsedInput}"
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerButton: {
    fontSize: 16,
    color: '#64748B',
  },
  deleteButton: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  statusCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statusButton: {
    paddingVertical: 12,
    backgroundColor: '#E0F7FA',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00BCD4',
  },
  statusButtonCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#00BCD4',
    fontWeight: '600',
  },
  statusButtonTextCompleted: {
    color: '#4CAF50',
  },
  metadata: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metadataText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
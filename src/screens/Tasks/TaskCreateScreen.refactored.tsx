import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../../navigation/types';
import { taskRepository } from '../../services/database/repositories/TaskRepository';
import { TaskParser, ParsedTask } from '../../core/tasks/parser';
import { TaskForm, TaskFormData } from '../../components/tasks';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

type TaskCreateScreenProps = RootStackScreenProps<'TaskCreate'>;

export const TaskCreateScreen: React.FC<TaskCreateScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const taskParser = new TaskParser();
  
  // Mode state
  const [mode, setMode] = useState<'natural' | 'form'>('natural');
  
  // Natural language mode state
  const [naturalInput, setNaturalInput] = useState(route.params?.prefillText || '');
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Parse natural language input
  const handleNaturalInputChange = (text: string) => {
    setNaturalInput(text);
    if (text.trim()) {
      const parsed = taskParser.parse(text);
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: TaskFormData) => {
    try {
      setLoading(true);
      
      await taskRepository.create({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        priority: formData.priority,
        dueDate: formData.dueDate?.getTime(),
        dueTime: formData.dueTime,
        userId: DEFAULT_USER_ID,
        goalId: formData.goalId,
        tags: formData.tags,
        notes: formData.notes,
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Handle natural language submission
  const handleNaturalSubmit = async () => {
    if (!parsedTask?.title.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      setLoading(true);
      
      await taskRepository.create({
        name: parsedTask.title,
        description: parsedTask.description,
        icon: parsedTask.suggestedIcon || '📝',
        color: 'ocean', // Default color for natural language
        priority: parsedTask.priority || 'medium',
        dueDate: parsedTask.dueDate?.getTime(),
        dueTime: parsedTask.dueTime,
        userId: DEFAULT_USER_ID,
        tags: parsedTask.tags || [],
        parsedInput: naturalInput,
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Prepare initial values for form mode from parsed task
  const getInitialValuesFromParsed = (): Partial<TaskFormData> => {
    if (!parsedTask) return {};
    
    return {
      name: parsedTask.title,
      description: parsedTask.description,
      icon: parsedTask.suggestedIcon || '📝',
      priority: parsedTask.priority || 'medium',
      dueDate: parsedTask.dueDate,
      tags: parsedTask.tags || [],
    };
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
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Task</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'natural' && styles.modeButtonActive]}
          onPress={() => setMode('natural')}
        >
          <Text style={[styles.modeButtonText, mode === 'natural' && styles.modeButtonTextActive]}>
            ✨ Natural Language
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'form' && styles.modeButtonActive]}
          onPress={() => setMode('form')}
        >
          <Text style={[styles.modeButtonText, mode === 'form' && styles.modeButtonTextActive]}>
            📝 Form
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'natural' ? (
        <View style={styles.naturalContainer}>
          {/* Natural Language Input */}
          <View style={styles.naturalInputContainer}>
            <TextInput
              style={styles.naturalInput}
              value={naturalInput}
              onChangeText={handleNaturalInputChange}
              placeholder="e.g., Call mom tomorrow at 3pm high priority #family"
              placeholderTextColor="#94A3B8"
              multiline
              autoFocus
            />
          </View>

          {/* Parsed Preview */}
          {parsedTask && (
            <View style={styles.parsedPreview}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewIcon}>{parsedTask.suggestedIcon || '📝'}</Text>
                <View style={styles.previewContent}>
                  <Text style={styles.previewTaskTitle}>{parsedTask.title}</Text>
                  {parsedTask.dueDate && (
                    <Text style={styles.previewDetail}>
                      📅 {parsedTask.parsedElements.dateText}
                      {parsedTask.dueTime && ` at ${parsedTask.dueTime}`}
                    </Text>
                  )}
                  {parsedTask.priority && (
                    <Text style={styles.previewDetail}>
                      ⚡ Priority: {parsedTask.priority}
                    </Text>
                  )}
                  {parsedTask.tags && parsedTask.tags.length > 0 && (
                    <Text style={styles.previewDetail}>
                      🏷️ Tags: {parsedTask.tags.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Create Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.createButton, !parsedTask && styles.createButtonDisabled]}
              onPress={handleNaturalSubmit}
              disabled={loading || !parsedTask}
            >
              <Text style={styles.createButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TaskForm
          mode="create"
          initialValues={getInitialValuesFromParsed()}
          onSubmit={handleFormSubmit}
          onCancel={() => navigation.goBack()}
          isLoading={loading}
          showProgress={false}
          showNotes={false}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 50,
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  modeButtonTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  naturalContainer: {
    flex: 1,
    padding: 16,
  },
  naturalInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  naturalInput: {
    fontSize: 16,
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  parsedPreview: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  previewDetail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 8,
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
});
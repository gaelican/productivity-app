import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../../navigation/types';
import { taskRepository } from '../../services/database/repositories/TaskRepository';
import { TaskParser, ParsedTask } from '../../core/tasks/parser';
import { GradientThemeManager, GradientTheme } from '../../core/tasks/gradients';
import { DateTimePickerComponent } from '../../components/tasks/DateTimePicker';
import { PrioritySelector } from '../../components/tasks/PrioritySelector';
import { TagInput } from '../../components/tasks/TagInput';
import { GoalSelector } from '../../components/tasks/GoalSelector';
import { IconPicker } from '../../components/tasks/IconPicker';

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
  
  // Form mode state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📝');
  const [selectedGradient, setSelectedGradient] = useState<GradientTheme>(
    GradientThemeManager.getGradientById('ocean')!
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [goalId, setGoalId] = useState<string | undefined>();
  
  // UI state
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Parse natural language input
  const handleNaturalInputChange = (text: string) => {
    setNaturalInput(text);
    if (text.trim()) {
      const parsed = taskParser.parse(text);
      setParsedTask(parsed);
      
      // Update form fields based on parsed data
      setName(parsed.title);
      if (parsed.suggestedIcon) setIcon(parsed.suggestedIcon);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.dueDate) setDueDate(parsed.dueDate);
      if (parsed.tags) setTags(parsed.tags);
    } else {
      setParsedTask(null);
    }
  };

  // Create task
  const handleCreate = async () => {
    const taskName = mode === 'natural' ? parsedTask?.title : name;
    
    if (!taskName?.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      setLoading(true);
      
      await taskRepository.create({
        name: taskName,
        description: mode === 'form' ? description : parsedTask?.description,
        icon,
        color: selectedGradient.id,
        priority,
        dueDate: dueDate?.getTime(),
        dueTime: parsedTask?.dueTime,
        userId: DEFAULT_USER_ID,
        goalId,
        tags,
        parsedInput: mode === 'natural' ? naturalInput : undefined,
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Text style={styles.createButton}>Create</Text>
          )}
        </TouchableOpacity>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode === 'natural' ? (
          <>
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
                  <Text style={styles.previewIcon}>{parsedTask.suggestedIcon || icon}</Text>
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
          </>
        ) : (
          <>
            {/* Form Mode */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Task Name</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="What needs to be done?"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add more details..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            <IconPicker value={icon} onChange={setIcon} />

            <PrioritySelector value={priority} onChange={setPriority} />

            <DateTimePickerComponent
              value={dueDate}
              onChange={setDueDate}
              mode="datetime"
              label="Due Date"
            />

            <TagInput value={tags} onChange={setTags} />

            <GoalSelector value={goalId} onChange={setGoalId} />
          </>
        )}

        {/* Gradient Selection (both modes) */}
        <View style={styles.gradientSection}>
          <Text style={styles.gradientLabel}>Color Theme</Text>
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

        {/* Gradient Picker */}
        {showGradientPicker && (
          <View style={styles.gradientPicker}>
            <ScrollView
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
          </View>
        )}
      </ScrollView>
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
  cancelButton: {
    fontSize: 16,
    color: '#64748B',
  },
  createButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewIcon: {
    fontSize: 32,
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
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gradientSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  gradientLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  gradientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    maxHeight: 300,
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
});
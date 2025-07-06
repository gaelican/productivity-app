import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientThemeManager, GradientTheme } from '../../core/tasks/gradients';
import { DateTimePickerComponent } from './DateTimePicker';
import { PrioritySelector } from './PrioritySelector';
import { TagInput } from './TagInput';
import { GoalSelector } from './GoalSelector';
import { IconPicker } from './IconPicker';
import { validateTaskForm, validateField, TaskFormValidationError } from './TaskFormValidation';

export interface TaskFormData {
  name: string;
  description?: string;
  notes?: string;
  icon: string;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  dueTime?: string;
  tags: string[];
  goalId?: string;
  progress: number;
}

export interface TaskFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  showProgress?: boolean;
  showNotes?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  mode,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  showProgress = true,
  showNotes = true,
}) => {
  // Form state
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [notes, setNotes] = useState(initialValues.notes || '');
  const [icon, setIcon] = useState(initialValues.icon || '📝');
  const [selectedGradient, setSelectedGradient] = useState<GradientTheme>(() => {
    const gradient = initialValues.color
      ? GradientThemeManager.getGradientById(initialValues.color)
      : null;
    return gradient || GradientThemeManager.getGradientById('ocean')!;
  });
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(
    initialValues.priority || 'medium'
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialValues.dueDate ? new Date(initialValues.dueDate) : undefined
  );
  const [tags, setTags] = useState<string[]>(initialValues.tags || []);
  const [goalId, setGoalId] = useState<string | undefined>(initialValues.goalId);
  const [progress, setProgress] = useState(initialValues.progress || 0);

  // UI state
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<TaskFormValidationError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Track changes for edit mode
  useEffect(() => {
    if (mode === 'edit') {
      const changed =
        name !== (initialValues.name || '') ||
        description !== (initialValues.description || '') ||
        notes !== (initialValues.notes || '') ||
        icon !== (initialValues.icon || '📝') ||
        selectedGradient.id !== (initialValues.color || 'ocean') ||
        priority !== (initialValues.priority || 'medium') ||
        dueDate?.getTime() !== initialValues.dueDate?.getTime() ||
        JSON.stringify(tags) !== JSON.stringify(initialValues.tags || []) ||
        goalId !== initialValues.goalId ||
        progress !== (initialValues.progress || 0);

      setHasChanges(changed);
    }
  }, [
    mode,
    name,
    description,
    notes,
    icon,
    selectedGradient,
    priority,
    dueDate,
    tags,
    goalId,
    progress,
    initialValues,
  ]);

  const handleSubmit = async () => {
    const formData: TaskFormData = {
      name,
      description: description || undefined,
      notes: notes || undefined,
      icon,
      color: selectedGradient.id,
      priority,
      dueDate,
      dueTime: initialValues.dueTime,
      tags,
      goalId,
      progress,
    };

    // Validate form before submission
    const validationErrors = await validateTaskForm(formData, mode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Mark all fields as touched to show all errors
      const allFields = new Set(Object.keys(formData));
      setTouched(allFields);
      return;
    }

    await onSubmit(formData);
  };

  // Field validation helper
  const handleFieldBlur = async (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
    
    const fieldValue = {
      name,
      description,
      notes,
      icon,
      color: selectedGradient.id,
      priority,
      dueDate,
      tags,
      goalId,
      progress,
    }[fieldName];
    
    const error = await validateField(fieldName, fieldValue, mode);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  };

  const isSubmitDisabled = mode === 'create' ? !name.trim() : !name.trim() || !hasChanges;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Task Name */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Task Name *</Text>
        <TextInput
          style={[styles.formInput, touched.has('name') && errors.name && styles.formInputError]}
          value={name}
          onChangeText={setName}
          onBlur={() => handleFieldBlur('name')}
          placeholder="What needs to be done?"
          placeholderTextColor="#94A3B8"
        />
        {touched.has('name') && errors.name && (
          <Text style={styles.errorText}>{errors.name}</Text>
        )}
      </View>

      {/* Description */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.formInput, styles.formTextArea, touched.has('description') && errors.description && styles.formInputError]}
          value={description}
          onChangeText={setDescription}
          onBlur={() => handleFieldBlur('description')}
          placeholder="Add more details..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
        />
        {touched.has('description') && errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      {/* Notes (if enabled) */}
      {showNotes && (
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Notes</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea, touched.has('notes') && errors.notes && styles.formInputError]}
            value={notes}
            onChangeText={setNotes}
            onBlur={() => handleFieldBlur('notes')}
            placeholder="Private notes..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
          {touched.has('notes') && errors.notes && (
            <Text style={styles.errorText}>{errors.notes}</Text>
          )}
        </View>
      )}

      {/* Icon Picker */}
      <IconPicker value={icon} onChange={setIcon} />

      {/* Priority Selector */}
      <PrioritySelector value={priority} onChange={setPriority} />

      {/* Due Date */}
      <View>
        <DateTimePickerComponent
          value={dueDate}
          onChange={(date) => {
            setDueDate(date);
            if (date) {
              handleFieldBlur('dueDate');
            }
          }}
          mode="datetime"
          label="Due Date"
        />
        {touched.has('dueDate') && errors.dueDate && (
          <Text style={styles.errorText}>{errors.dueDate}</Text>
        )}
      </View>

      {/* Progress Slider (if enabled and in edit mode) */}
      {showProgress && mode === 'edit' && (
        <View style={styles.progressSection}>
          <Text style={styles.formLabel}>Progress: {progress}%</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={selectedGradient.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
          <View style={styles.progressButtons}>
            {[0, 25, 50, 75, 100].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.progressButton,
                  progress === value && styles.progressButtonActive,
                ]}
                onPress={() => {
                  setProgress(value);
                  handleFieldBlur('progress');
                }}
              >
                <Text
                  style={[
                    styles.progressButtonText,
                    progress === value && styles.progressButtonTextActive,
                  ]}
                >
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {touched.has('progress') && errors.progress && (
            <Text style={styles.errorText}>{errors.progress}</Text>
          )}
        </View>
      )}

      {/* Tags */}
      <View>
        <TagInput value={tags} onChange={(newTags) => {
          setTags(newTags);
          handleFieldBlur('tags');
        }} />
        {touched.has('tags') && errors.tags && (
          <Text style={[styles.errorText, { marginTop: -8, marginBottom: 8 }]}>{errors.tags}</Text>
        )}
      </View>

      {/* Goal Selector */}
      <GoalSelector value={goalId} onChange={setGoalId} />

      {/* Color Theme */}
      <View style={styles.gradientSection}>
        <Text style={styles.formLabel}>Color Theme</Text>
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
                    selectedGradient.id === gradient.id && styles.gradientOptionSelected,
                  ]}
                />
                <Text style={styles.gradientOptionName}>{gradient.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            isSubmitDisabled && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || isSubmitDisabled}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
  progressSection: {
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  progressButtonActive: {
    backgroundColor: '#E0E7FF',
  },
  progressButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  progressButtonTextActive: {
    color: '#6366F1',
  },
  gradientSection: {
    marginTop: 16,
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
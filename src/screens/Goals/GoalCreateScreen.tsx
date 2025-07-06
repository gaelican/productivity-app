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
import { goalRepository } from '../../services/database/repositories/GoalRepository';
import { GradientThemeManager, GradientTheme } from '../../core/tasks/gradients';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

type GoalCreateScreenProps = StackScreenProps<RootStackParamList, 'GoalCreate'>;

interface Milestone {
  id: string;
  value: number;
  label: string;
}

export const GoalCreateScreen: React.FC<GoalCreateScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'health' | 'finance' | 'learning' | 'personal' | 'work'>('personal');
  const [goalType, setGoalType] = useState<'numeric' | 'habit' | 'milestone'>('numeric');
  const [selectedGradient, setSelectedGradient] = useState<GradientTheme>(
    GradientThemeManager.getGradientById('ocean')!
  );
  const [showGradientPicker, setShowGradientPicker] = useState(false);

  // Step 2: Target & Progress
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('total');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneValue, setNewMilestoneValue] = useState('');
  const [newMilestoneLabel, setNewMilestoneLabel] = useState('');

  // Step 3: Timeline & Priority
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [linkedRoutineId, setLinkedRoutineId] = useState<string | null>(null);
  
  // Categories with icons
  const categories = [
    { id: 'health', name: 'Health', icon: '💪' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'personal', name: 'Personal', icon: '🌟' },
    { id: 'work', name: 'Work', icon: '💼' },
  ];

  // Goal types
  const goalTypes = [
    { id: 'numeric', name: 'Numeric Goal', description: 'Track progress with numbers', icon: '📊' },
    { id: 'habit', name: 'Habit Goal', description: 'Build consistent habits', icon: '🔄' },
    { id: 'milestone', name: 'Milestone Goal', description: 'Achieve specific milestones', icon: '🎯' },
  ];

  // Frequency options
  const frequencies = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'total', name: 'Total' },
  ];

  // Priority levels
  const priorities = [
    { id: 'low', name: 'Low', color: '#10B981' },
    { id: 'medium', name: 'Medium', color: '#F59E0B' },
    { id: 'high', name: 'High', color: '#EF4444' },
  ];

  const handleAddMilestone = () => {
    if (!newMilestoneValue.trim() || !newMilestoneLabel.trim()) return;
    
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      value: parseInt(newMilestoneValue) || 0,
      label: newMilestoneLabel.trim(),
    };
    
    setMilestones([...milestones].sort((a, b) => a.value - b.value));
    setNewMilestoneValue('');
    setNewMilestoneLabel('');
    setShowAddMilestone(false);
  };

  const handleRemoveMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0 && goalType;
      case 1:
        if (goalType === 'numeric') {
          return targetValue.trim().length > 0 && unit.trim().length > 0;
        } else if (goalType === 'habit') {
          return targetValue.trim().length > 0;
        } else if (goalType === 'milestone') {
          return milestones.length > 0;
        }
        return false;
      case 2:
        return deadline.trim().length > 0;
      default:
        return false;
    }
  };

  const handleCreateGoal = async () => {
    if (!canProceed()) return;
    
    try {
      setLoading(true);
      
      // Format deadline
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        Alert.alert('Error', 'Invalid deadline date');
        return;
      }
      
      // Create goal
      await goalRepository.createGoal({
        name,
        description,
        category,
        goalType,
        targetValue: parseFloat(targetValue) || 0,
        currentValue: parseFloat(currentValue) || 0,
        unit: goalType === 'habit' ? 'times' : unit,
        deadline: deadlineDate.getTime(),
        priority,
        color: selectedGradient.id,
        frequency,
        milestones: goalType === 'milestone' ? JSON.stringify(milestones) : undefined,
        linkedRoutineId,
        userId: DEFAULT_USER_ID,
      });
      
      Alert.alert(
        'Success',
        'Goal created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Basic Info', 'Target', 'Timeline'].map((step, index) => (
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
        <Text style={styles.inputLabel}>Goal Name</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Read 12 books"
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
          placeholder="Why is this goal important to you?"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Goal Type Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Goal Type</Text>
        <View style={styles.typeGrid}>
          {goalTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeOption,
                goalType === type.id && styles.typeOptionSelected,
              ]}
              onPress={() => setGoalType(type.id as any)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeName,
                goalType === type.id && styles.typeNameSelected,
              ]}>
                {type.name}
              </Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryOption,
                category === cat.id && styles.categoryOptionSelected,
              ]}
              onPress={() => setCategory(cat.id as any)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryName,
                category === cat.id && styles.categoryNameSelected,
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

  const renderTargetSetup = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Set Your Target</Text>
      
      {/* Numeric Goal */}
      {goalType === 'numeric' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Value</Text>
            <TextInput
              style={styles.textInput}
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="e.g., 10000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit</Text>
            <TextInput
              style={styles.textInput}
              value={unit}
              onChangeText={setUnit}
              placeholder="e.g., steps, books, pounds"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Progress (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={currentValue}
              onChangeText={setCurrentValue}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      {/* Habit Goal */}
      {goalType === 'habit' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Frequency</Text>
            <TextInput
              style={styles.textInput}
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="e.g., 5"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency Period</Text>
            <View style={styles.frequencyGrid}>
              {frequencies.map(freq => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.frequencyOption,
                    frequency === freq.id && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency(freq.id as any)}
                >
                  <Text style={[
                    styles.frequencyText,
                    frequency === freq.id && styles.frequencyTextSelected,
                  ]}>
                    {freq.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.habitExample}>
            Example: Exercise {targetValue || '5'} times {frequency}
          </Text>
        </>
      )}

      {/* Milestone Goal */}
      {goalType === 'milestone' && (
        <>
          <Text style={styles.inputHint}>
            Add milestones to track your progress
          </Text>

          {/* Milestone List */}
          {milestones.length > 0 && (
            <View style={styles.milestoneList}>
              {milestones.map((milestone) => (
                <View key={milestone.id} style={styles.milestoneItem}>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneValue}>{milestone.value}</Text>
                    <Text style={styles.milestoneLabel}>{milestone.label}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveMilestone(milestone.id)}
                    style={styles.removeMilestoneButton}
                  >
                    <Text style={styles.removeMilestoneText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Milestone Button */}
          <TouchableOpacity
            style={styles.addMilestoneButton}
            onPress={() => setShowAddMilestone(true)}
          >
            <Text style={styles.addMilestoneIcon}>➕</Text>
            <Text style={styles.addMilestoneText}>Add Milestone</Text>
          </TouchableOpacity>

          {/* Set target value for milestone goals (the final milestone) */}
          {milestones.length > 0 && (
            <View style={styles.targetInfo}>
              <Text style={styles.targetInfoLabel}>Final Target:</Text>
              <Text style={styles.targetInfoValue}>
                {Math.max(...milestones.map(m => m.value))}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Add Milestone Modal */}
      <Modal
        visible={showAddMilestone}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMilestone(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddMilestone(false)}
        >
          <TouchableOpacity
            style={styles.addMilestoneModal}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Add Milestone</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Value</Text>
              <TextInput
                style={styles.textInput}
                value={newMilestoneValue}
                onChangeText={setNewMilestoneValue}
                placeholder="e.g., 25"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label</Text>
              <TextInput
                style={styles.textInput}
                value={newMilestoneLabel}
                onChangeText={setNewMilestoneLabel}
                placeholder="e.g., 25% complete"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddMilestone(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, (!newMilestoneValue.trim() || !newMilestoneLabel.trim()) && styles.createButtonDisabled]}
                onPress={handleAddMilestone}
                disabled={!newMilestoneValue.trim() || !newMilestoneLabel.trim()}
              >
                <Text style={styles.createButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Timeline & Priority</Text>
      
      {/* Deadline Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Deadline</Text>
        <TextInput
          style={styles.textInput}
          value={deadline}
          onChangeText={setDeadline}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.inputHint}>
          When do you want to achieve this goal?
        </Text>
      </View>

      {/* Priority Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Priority</Text>
        <View style={styles.priorityGrid}>
          {priorities.map(prio => (
            <TouchableOpacity
              key={prio.id}
              style={[
                styles.priorityOption,
                priority === prio.id && styles.priorityOptionSelected,
                priority === prio.id && { backgroundColor: `${prio.color}20` },
              ]}
              onPress={() => setPriority(prio.id as any)}
            >
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: prio.color },
                ]}
              />
              <Text
                style={[
                  styles.priorityText,
                  priority === prio.id && { color: prio.color },
                ]}
              >
                {prio.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Goal Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{name || 'Not set'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>
            {goalTypes.find(t => t.id === goalType)?.name || 'Not set'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Target:</Text>
          <Text style={styles.summaryValue}>
            {goalType === 'numeric' ? `${targetValue} ${unit}` :
             goalType === 'habit' ? `${targetValue} times ${frequency}` :
             goalType === 'milestone' ? `${milestones.length} milestones` : 'Not set'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Deadline:</Text>
          <Text style={styles.summaryValue}>{deadline || 'Not set'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Priority:</Text>
          <Text style={[
            styles.summaryValue,
            { color: priorities.find(p => p.id === priority)?.color },
          ]}>
            {priorities.find(p => p.id === priority)?.name}
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
        return renderTargetSetup();
      case 2:
        return renderTimeline();
      default:
        return null;
    }
  };

  // Update target value for milestone goals
  React.useEffect(() => {
    if (goalType === 'milestone' && milestones.length > 0) {
      setTargetValue(Math.max(...milestones.map(m => m.value)).toString());
    }
  }, [milestones, goalType]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Goal</Text>
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
            onPress={handleCreateGoal}
            disabled={!canProceed() || loading}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {loading ? 'Creating...' : 'Create Goal'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  typeGrid: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  typeOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F9FF',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  typeNameSelected: {
    color: '#6366F1',
  },
  typeDescription: {
    fontSize: 12,
    color: '#64748B',
    position: 'absolute',
    bottom: 16,
    left: 52,
  },
  categoryScroll: {
    maxHeight: 80,
  },
  categoryOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  categoryOptionSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: '#FFFFFF',
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
  selectorArrow: {
    fontSize: 12,
    color: '#64748B',
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
  frequencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  frequencyOptionSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  frequencyTextSelected: {
    color: '#FFFFFF',
  },
  habitExample: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
  },
  milestoneList: {
    marginBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
    marginRight: 12,
  },
  milestoneLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  removeMilestoneButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  removeMilestoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  addMilestoneButton: {
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
  addMilestoneIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addMilestoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  addMilestoneModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  targetInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInfoLabel: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginRight: 8,
  },
  targetInfoValue: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '700',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  priorityOptionSelected: {
    borderWidth: 2,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
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
    flex: 1,
    textAlign: 'right',
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
});
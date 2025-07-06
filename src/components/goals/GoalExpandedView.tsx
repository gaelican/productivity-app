import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientSystem } from '../../packages/design-system';
import Goal from '../../services/database/models/Goal';
import GoalProgressBar, { GoalCircularProgress } from './GoalProgressBar';
import { goalRepository } from '../../services/database/repositories/GoalRepository';

interface GoalExpandedViewProps {
  goal: Goal;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewAnalytics?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GoalExpandedView: React.FC<GoalExpandedViewProps> = ({
  goal,
  onClose,
  onEdit,
  onDelete,
  onViewAnalytics,
}) => {
  const insets = useSafeAreaInsets();
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [customIncrement, setCustomIncrement] = useState('');
  const [incrementNote, setIncrementNote] = useState('');
  
  // Get gradient colors
  const gradient = GradientSystem.getGradientById(goal.color) || GradientSystem.getDefaultGradient();
  const colors = GradientSystem.getColorsArray(gradient);
  
  // Format dates
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);
  
  // Handle quick increment
  const handleQuickIncrement = useCallback(async (value: number) => {
    try {
      await goalRepository.incrementGoalProgress(goal.id, value);
      Alert.alert('Success', `Added ${value} ${goal.unit}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  }, [goal.id, goal.unit]);
  
  // Handle custom increment
  const handleCustomIncrement = useCallback(async () => {
    const value = parseFloat(customIncrement);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Value', 'Please enter a valid positive number');
      return;
    }
    
    try {
      await goalRepository.incrementGoalProgress(goal.id, value, incrementNote);
      setShowIncrementModal(false);
      setCustomIncrement('');
      setIncrementNote('');
      Alert.alert('Success', `Added ${value} ${goal.unit}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  }, [goal.id, goal.unit, customIncrement, incrementNote]);
  
  // Recent progress entries
  const recentProgress = useMemo(() => {
    return goal.recentProgress.slice(-5).reverse();
  }, [goal.recentProgress]);
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.icon}>{goal.icon}</Text>
            <Text style={styles.title}>{goal.name}</Text>
            <Text style={styles.category}>{goal.category}</Text>
          </View>
        </View>
        
        {/* Circular Progress */}
        <View style={styles.progressSection}>
          <GoalCircularProgress
            currentValue={goal.currentValue}
            targetValue={goal.targetValue}
            size={180}
            strokeWidth={16}
            gradientColors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            showPercentage={true}
          />
          
          <View style={styles.progressDetails}>
            <View style={styles.progressDetailRow}>
              <Text style={styles.progressLabel}>Current</Text>
              <Text style={styles.progressValue}>
                {goal.currentValue} {goal.unit}
              </Text>
            </View>
            <View style={styles.progressDetailRow}>
              <Text style={styles.progressLabel}>Target</Text>
              <Text style={styles.progressValue}>
                {goal.targetValue} {goal.unit}
              </Text>
            </View>
            <View style={styles.progressDetailRow}>
              <Text style={styles.progressLabel}>Remaining</Text>
              <Text style={styles.progressValue}>
                {goal.remainingValue} {goal.unit}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Quick Increment Buttons */}
        <View style={styles.quickIncrementSection}>
          <Text style={styles.sectionTitle}>Quick Progress</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickIncrementScroll}
          >
            {/* Default increment */}
            <TouchableOpacity
              style={styles.quickIncrementButton}
              onPress={() => handleQuickIncrement(goal.defaultIncrement)}
            >
              <Text style={styles.quickIncrementValue}>
                +{goal.defaultIncrement}
              </Text>
              <Text style={styles.quickIncrementLabel}>Default</Text>
            </TouchableOpacity>
            
            {/* Custom increments */}
            {goal.quickIncrements.map((increment, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickIncrementButton}
                onPress={() => handleQuickIncrement(increment.value)}
              >
                {increment.icon && (
                  <Text style={styles.quickIncrementIcon}>{increment.icon}</Text>
                )}
                <Text style={styles.quickIncrementValue}>
                  +{increment.value}
                </Text>
                <Text style={styles.quickIncrementLabel}>{increment.label}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Custom button */}
            <TouchableOpacity
              style={[styles.quickIncrementButton, styles.customIncrementButton]}
              onPress={() => setShowIncrementModal(true)}
            >
              <Text style={styles.quickIncrementIcon}>✏️</Text>
              <Text style={styles.quickIncrementValue}>Custom</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Analytics Summary */}
        {goal.averageDailyProgress > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Progress Insights</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>
                  {goal.averageDailyProgress.toFixed(1)}
                </Text>
                <Text style={styles.analyticsLabel}>Avg Daily</Text>
              </View>
              {goal.projectedCompletionDate && (
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>
                    {formatDate(goal.projectedCompletionDate)}
                  </Text>
                  <Text style={styles.analyticsLabel}>Est. Complete</Text>
                </View>
              )}
              {goal.daysUntilTarget !== null && (
                <View style={styles.analyticsCard}>
                  <Text style={[
                    styles.analyticsValue,
                    goal.isOverdue && styles.overdueValue
                  ]}>
                    {goal.daysUntilTarget}
                  </Text>
                  <Text style={styles.analyticsLabel}>Days Left</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Recent Progress */}
        {recentProgress.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Progress</Text>
            {recentProgress.map((entry, index) => (
              <View key={index} style={styles.recentEntry}>
                <Text style={styles.recentDate}>
                  {formatDate(entry.date)}
                </Text>
                <Text style={styles.recentValue}>
                  +{entry.increment} {goal.unit}
                </Text>
                {entry.note && (
                  <Text style={styles.recentNote}>{entry.note}</Text>
                )}
              </View>
            ))}
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {onViewAnalytics && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onViewAnalytics}
            >
              <Text style={styles.actionButtonIcon}>📊</Text>
              <Text style={styles.actionButtonText}>Analytics</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onEdit}
            >
              <Text style={styles.actionButtonIcon}>✏️</Text>
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {goal.status === 'active' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                await goal.changeStatus('paused');
                onClose();
              }}
            >
              <Text style={styles.actionButtonIcon}>⏸️</Text>
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
          {goal.status === 'paused' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                await goal.changeStatus('active');
                onClose();
              }}
            >
              <Text style={styles.actionButtonIcon}>▶️</Text>
              <Text style={styles.actionButtonText}>Resume</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      
      {/* Custom Increment Modal */}
      <Modal
        visible={showIncrementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIncrementModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIncrementModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Add Progress</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={customIncrement}
                  onChangeText={setCustomIncrement}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.unitLabel}>{goal.unit}</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={incrementNote}
                onChangeText={setIncrementNote}
                placeholder="Add a note..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowIncrementModal(false);
                  setCustomIncrement('');
                  setIncrementNote('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCustomIncrement}
              >
                <Text style={styles.addButtonText}>Add Progress</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerContent: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressDetails: {
    marginTop: 20,
    width: '80%',
  },
  progressDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickIncrementSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  quickIncrementScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickIncrementButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    marginRight: 12,
  },
  customIncrementButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  quickIncrementIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickIncrementValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickIncrementLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  analyticsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overdueValue: {
    color: '#FEE2E2',
  },
  analyticsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  recentEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  recentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentNote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 'auto',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unitLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#64748B',
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
  addButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default GoalExpandedView;
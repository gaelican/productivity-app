import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Task from '../../services/database/models/Task';
import { GradientThemeManager } from '../../core/tasks/gradients';
import { taskRepository } from '../../services/database/repositories/TaskRepository';
import Goal from '../../services/database/models/Goal';
import Routine from '../../services/database/models/Routine';
import withObservables from '@nozbe/with-observables';
import { Observable } from '@nozbe/watermelondb/utils/rx';

interface TaskExpandedViewProps {
  task: Task;
  visible: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  goal?: Goal | null;
  routine?: Routine | null;
}

const TaskExpandedViewComponent: React.FC<TaskExpandedViewProps> = ({
  task,
  visible,
  onClose,
  onEdit,
  onDelete,
  goal,
  routine,
}) => {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(task.progress);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);

  const gradient = GradientThemeManager.getGradientById(task.color);

  const handleComplete = async () => {
    try {
      if (task.isCompleted) {
        await task.uncomplete();
      } else {
        await task.complete();
      }
      onClose();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    try {
      setProgress(newProgress);
      await task.updateProgress(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await taskRepository.update(task.id, { notes });
      setEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskRepository.delete(task.id);
              onClose();
              onDelete?.(task);
            } catch (error) {
              console.error('Error deleting task:', error);
            }
          },
        },
      ]
    );
  };

  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    urgent: '#DC2626',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
          {/* Header */}
          <LinearGradient
            colors={gradient?.colors || ['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.headerActions}>
                {onEdit && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onEdit(task);
                    }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.taskIcon}>{task.icon}</Text>
            <Text style={styles.taskTitle}>{task.name}</Text>
            
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Details */}
            <View style={styles.section}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    task.isCompleted && styles.statusBadgeCompleted,
                  ]}
                  onPress={handleComplete}
                >
                  <Text
                    style={[
                      styles.statusText,
                      task.isCompleted && styles.statusTextCompleted,
                    ]}
                  >
                    {task.isCompleted ? '✓ Completed' : '○ Active'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Priority</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityColors[task.priority] },
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Text>
                </View>
              </View>

              {task.formattedDueDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text
                    style={[styles.detailValue, task.isOverdue && styles.overdueText]}
                  >
                    {task.formattedDueDate}
                    {task.dueTime && ` at ${task.dueTime}`}
                  </Text>
                </View>
              )}

              {goal && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Linked Goal</Text>
                  <View style={styles.linkedItem}>
                    <Text style={styles.linkedIcon}>{goal.icon || '🎯'}</Text>
                    <Text style={styles.linkedText}>{goal.name}</Text>
                  </View>
                </View>
              )}

              {routine && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From Routine</Text>
                  <View style={styles.linkedItem}>
                    <Text style={styles.linkedIcon}>{routine.icon || '🔄'}</Text>
                    <Text style={styles.linkedText}>{routine.name}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Progress Section */}
            {!task.isCompleted && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={gradient?.colors || ['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
                <View style={styles.progressButtons}>
                  {[0, 25, 50, 75, 100].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.progressButton,
                        progress === value && styles.progressButtonActive,
                      ]}
                      onPress={() => handleProgressChange(value)}
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
              </View>
            )}

            {/* Notes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <TouchableOpacity
                  onPress={() => setEditingNotes(!editingNotes)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>
                    {editingNotes ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
              {editingNotes ? (
                <View>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Add notes..."
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveNotes}
                  >
                    <Text style={styles.saveButtonText}>Save Notes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.notesText, !notes && styles.notesPlaceholder]}>
                  {notes || 'No notes added yet'}
                </Text>
              )}
            </View>

            {/* Tags Section */}
            {task.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {task.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Metadata */}
            <View style={[styles.section, styles.metadata]}>
              <Text style={styles.metadataText}>
                Created {new Date(task.createdAt).toLocaleDateString()}
              </Text>
              {task.completedAt && (
                <Text style={styles.metadataText}>
                  Completed {new Date(task.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                task.isCompleted && styles.primaryButtonCompleted,
              ]}
              onPress={handleComplete}
            >
              <LinearGradient
                colors={
                  task.isCompleted
                    ? ['#64748B', '#475569']
                    : gradient?.colors || ['#6366F1', '#8B5CF6']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {task.isCompleted ? 'Mark as Active' : 'Mark as Complete'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
  },
  taskIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  overdueText: {
    color: '#EF4444',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statusBadgeCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: '#10B981',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkedIcon: {
    fontSize: 16,
  },
  linkedText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  notesPlaceholder: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#64748B',
  },
  metadata: {
    marginBottom: 24,
  },
  metadataText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonCompleted: {
    opacity: 0.8,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// Enhanced component with observables for linked goal and routine
const enhance = withObservables(['task'], ({ task }) => ({
  task,
  goal: task.goalId ? task.goal : null,
  routine: task.routineId ? task.routine : null,
}));

export const TaskExpandedView = enhance(TaskExpandedViewComponent);
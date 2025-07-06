import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Task } from '../../packages/types';
import { GradientThemeManager } from './gradients';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onEdit?: () => void;
  onSwipeComplete?: () => void;
  onSwipeDelete?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = screenWidth - (CARD_MARGIN * 2);

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onEdit,
}) => {
  const gradient = GradientThemeManager.getGradientById(task.color) || GradientThemeManager.getGradientById('ocean');
  const colors = gradient?.colors || ['#7DD3FC', '#0EA5E9'];

  const handleComplete = () => {
    // No animations in core version - just call completion handler
    onComplete();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header with icon and completion circle */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{task.icon}</Text>
            </View>
            <View style={styles.rightButtons}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={onEdit}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.completionButton}
                onPress={handleComplete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[
                  styles.completionCircle,
                  task.isCompleted && styles.completionCircleFilled
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Task title */}
          <Text
            style={[
              styles.title,
              task.isCompleted && styles.titleCompleted
            ]}
            numberOfLines={2}
          >
            {task.name}
          </Text>

          {/* Metadata row */}
          <View style={styles.metadataRow}>
            {/* Priority indicator */}
            {task.priority !== 'medium' && (
              <View style={[
                styles.priorityBadge,
                task.priority === 'high' && styles.priorityHigh,
                task.priority === 'urgent' && styles.priorityUrgent,
                task.priority === 'low' && styles.priorityLow,
              ]}>
                <Text style={styles.priorityText}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Due date */}
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Text style={styles.dueDate}>
                  {formatDueDate(task.dueDate, task.dueTime)}
                </Text>
              </View>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {task.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {task.tags.length > 2 && (
                  <Text style={styles.moreText}>+{task.tags.length - 2}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Helper function to format due date
function formatDueDate(date: Date, time?: string): string {
  const now = new Date();
  const dueDate = new Date(date);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dateStr = '';
  if (diffDays === 0) {
    dateStr = 'Today';
  } else if (diffDays === 1) {
    dateStr = 'Tomorrow';
  } else if (diffDays === -1) {
    dateStr = 'Yesterday';
  } else if (diffDays < -1) {
    dateStr = `${Math.abs(diffDays)} days ago`;
  } else if (diffDays <= 7) {
    dateStr = dueDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (time) {
    dateStr += ` at ${time}`;
  }

  return dateStr;
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 14,
  },
  completionButton: {
    padding: 4,
  },
  completionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  completionCircleFilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 24,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  priorityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  priorityUrgent: {
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
  },
  priorityLow: {
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  moreText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
});
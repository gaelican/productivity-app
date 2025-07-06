import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientThemeManager } from '../../core/tasks/gradients';
import Routine from '../../services/database/models/Routine';
import Task from '../../services/database/models/Task';
import { Q } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';

interface RoutineExpandedViewProps {
  routine: Routine;
  onClose: () => void;
  onStartRoutine: () => void;
  onConfigure: () => void;
  onAnalytics: () => void;
  tasks?: Task[];
}

interface TaskItemProps {
  task: Task;
  index: number;
  isLocked: boolean;
  dependencyName?: string;
  onPress: (task: Task) => void;
  activeTaskId?: string;
  elapsedTime?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TaskItem: React.FC<TaskItemProps> = React.memo(({
  task,
  index,
  isLocked,
  dependencyName,
  onPress,
  activeTaskId,
  elapsedTime,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const isActive = task.id === activeTaskId;
  const timeRequirement = task.tags?.find(tag => tag.includes('min'))?.match(/(\d+)\s*min/)?.[1];
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View
      style={[
        styles.taskItem,
        { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        })}] },
        isActive && styles.activeTaskItem,
        isLocked && styles.lockedTaskItem,
      ]}
    >
      <TouchableOpacity
        onPress={() => !isLocked && onPress(task)}
        disabled={isLocked}
        style={styles.taskItemTouchable}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskLeftContent}>
            <Text style={styles.taskIcon}>
              {task.isCompleted ? '✓' : isActive ? '⏱️' : isLocked ? '🔒' : '○'}
            </Text>
            <View style={styles.taskTextContainer}>
              <Text style={[
                styles.taskName,
                task.isCompleted && styles.completedTaskName,
                isLocked && styles.lockedTaskName,
              ]}>
                {index + 1}. {task.name}
              </Text>
              {isLocked && dependencyName && (
                <Text style={styles.dependencyText}>
                  Requires: {dependencyName}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.taskRightContent}>
            {isActive && elapsedTime !== undefined && timeRequirement ? (
              <Text style={styles.timerText}>
                {formatTime(elapsedTime)}/{timeRequirement} min
              </Text>
            ) : timeRequirement ? (
              <Text style={styles.timeText}>[{timeRequirement} min]</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const RoutineExpandedView: React.FC<RoutineExpandedViewProps> = ({
  routine,
  onClose,
  onStartRoutine,
  onConfigure,
  onAnalytics,
  tasks = [],
}) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Get gradient colors
  const gradient = GradientThemeManager.getGradientById(routine.color) || GradientThemeManager.getGradientById('ocean');
  const colors = gradient?.colors || ['#7DD3FC', '#0EA5E9'];

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Timer logic
  useEffect(() => {
    if (activeTaskId) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTaskId]);

  // Sort tasks by dependencies
  const sortedTasks = useMemo(() => {
    if (!tasks.length) return [];
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const sorted: Task[] = [];
    const visited = new Set<string>();
    
    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      // Visit dependencies first
      const deps = routine.taskDependencies?.filter(d => d.taskId === taskId) || [];
      deps.forEach(dep => {
        const depTask = tasks.find(t => t.id === dep.taskId);
        if (depTask && !visited.has(depTask.id)) {
          visit(depTask.id);
        }
      });
      
      sorted.push(task);
    };
    
    // Visit all tasks
    tasks.forEach(task => visit(task.id));
    
    return sorted;
  }, [tasks, routine.taskDependencies]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return (completed / tasks.length) * 100;
  }, [tasks]);

  // Check if task is locked
  const isTaskLocked = useCallback((task: Task, index: number) => {
    if (index === 0) return false;
    
    // Check if previous task in order is completed
    const previousTask = sortedTasks[index - 1];
    return previousTask && !previousTask.isCompleted;
  }, [sortedTasks]);

  // Get dependency name for locked tasks
  const getDependencyName = useCallback((task: Task, index: number) => {
    if (index === 0) return undefined;
    const previousTask = sortedTasks[index - 1];
    return previousTask?.name;
  }, [sortedTasks]);

  // Calculate average completion time (mock for now)
  const averageTime = useMemo(() => {
    const timeReqs = tasks
      .map(t => t.tags?.find(tag => tag.includes('min'))?.match(/(\d+)\s*min/)?.[1])
      .filter(Boolean)
      .map(Number);
    
    if (!timeReqs.length) return 0;
    return Math.round(timeReqs.reduce((a, b) => a + b, 0) / timeReqs.length);
  }, [tasks]);

  const handleTaskPress = useCallback((task: Task) => {
    if (task.isCompleted) return;
    
    if (activeTaskId === task.id) {
      setActiveTaskId(null);
    } else {
      setActiveTaskId(task.id);
      setElapsedTime(0);
    }
  }, [activeTaskId]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [fadeAnim, slideAnim, onClose]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{routine.name.toUpperCase()}</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Linked Goals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Goals:</Text>
            <View style={styles.goalsRow}>
              <View style={styles.goalCard}>
                <Text style={styles.goalName}>Fitness Goal</Text>
                <View style={styles.goalProgress}>
                  <View style={[styles.goalProgressFill, { width: '80%' }]} />
                </View>
                <Text style={styles.goalProgressText}>80%</Text>
              </View>
              <View style={styles.goalCard}>
                <Text style={styles.goalName}>Wellness Goal</Text>
                <View style={styles.goalProgress}>
                  <View style={[styles.goalProgressFill, { width: '60%' }]} />
                </View>
                <Text style={styles.goalProgressText}>60%</Text>
              </View>
            </View>
          </View>

          {/* Metrics Section */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>STREAK</Text>
              <Text style={styles.metricValue}>🔥 {routine.currentStreak}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>COMPLETED</Text>
              <Text style={styles.metricValue}>{routine.totalCompletions}x</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>AVERAGE TIME</Text>
              <Text style={styles.metricValue}>{averageTime} min</Text>
            </View>
          </View>

          {/* Tasks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TASKS (Sorted by dependency):</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
            ) : (
              <View style={styles.tasksList}>
                {sortedTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    isLocked={isTaskLocked(task, index)}
                    dependencyName={getDependencyName(task, index)}
                    onPress={handleTaskPress}
                    activeTaskId={activeTaskId}
                    elapsedTime={activeTaskId === task.id ? elapsedTime : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onStartRoutine}>
            <Text style={styles.actionButtonText}>▶️ Start Routine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onConfigure}>
            <Text style={styles.actionButtonText}>⚙️ Configure</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onAnalytics}>
            <Text style={styles.actionButtonText}>📊 Analytics</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    zIndex: 1,
    padding: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 45,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  goalName: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  goalProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  goalProgressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tasksList: {
    gap: 10,
  },
  taskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTaskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lockedTaskItem: {
    opacity: 0.6,
  },
  taskItemTouchable: {
    padding: 16,
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  taskTextContainer: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  completedTaskName: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  lockedTaskName: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dependencyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  taskRightContent: {
    marginLeft: 10,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginTop: 50,
  },
});

// Enhanced component with database observables
const enhance = withObservables(['routine'], ({ routine }: { routine: Routine }) => ({
  routine,
  tasks: routine.tasks.observe(),
}));

export default withDatabase(enhance(React.memo(RoutineExpandedView)));
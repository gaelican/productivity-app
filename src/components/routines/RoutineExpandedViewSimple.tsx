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

interface RoutineExpandedViewProps {
  routine: Routine;
  onClose: () => void;
  onStartRoutine: () => void;
  onConfigure: () => void;
  onAnalytics: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RoutineExpandedViewSimple: React.FC<RoutineExpandedViewProps> = ({
  routine,
  onClose,
  onStartRoutine,
  onConfigure,
  onAnalytics,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Load tasks manually
  useEffect(() => {
    loadTasks();
  }, [routine.id]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Loading tasks for routine: ${routine.name}`);
      
      // Fetch tasks for this routine
      const routineTasks = await routine.tasks.fetch();
      console.log(`Loaded ${routineTasks.length} tasks`);
      
      setTasks(routineTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Get gradient colors safely
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

  // Calculate progress
  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return (completed / tasks.length) * 100;
  }, [tasks]);

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
          {/* Metrics Section */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>STREAK</Text>
              <Text style={styles.metricValue}>🔥 {routine.currentStreak || 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>COMPLETED</Text>
              <Text style={styles.metricValue}>{routine.totalCompletions || 0}x</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>SCHEDULE</Text>
              <Text style={styles.metricValue}>{routine.scheduleType}</Text>
            </View>
          </View>

          {/* Tasks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              TASKS {tasks.length > 0 ? `(${tasks.length})` : ''}:
            </Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
                <TouchableOpacity onPress={loadTasks} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : tasks.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Text style={styles.emptyTasksText}>No tasks added yet</Text>
                <Text style={styles.emptyTasksSubtext}>Add tasks to this routine to get started</Text>
              </View>
            ) : (
              <View style={styles.tasksList}>
                {tasks.map((task, index) => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskContent}>
                      <View style={styles.taskLeftContent}>
                        <Text style={styles.taskIcon}>
                          {task.isCompleted ? '✓' : '○'}
                        </Text>
                        <Text style={[
                          styles.taskName,
                          task.isCompleted && styles.completedTaskName,
                        ]}>
                          {index + 1}. {task.name}
                        </Text>
                      </View>
                      {task.tags && task.tags.length > 0 && (
                        <View style={styles.taskTags}>
                          {task.tags.map((tag, tagIndex) => (
                            <Text key={tagIndex} style={styles.taskTag}>
                              {tag}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description Section */}
          {routine.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DESCRIPTION:</Text>
              <Text style={styles.description}>{routine.description}</Text>
            </View>
          )}
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
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
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
  emptyTasks: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTasksText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyTasksSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  taskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
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
  taskName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  completedTaskName: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskTags: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 10,
  },
  taskTag: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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

export default React.memo(RoutineExpandedViewSimple);
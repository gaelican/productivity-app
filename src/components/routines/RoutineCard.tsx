import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientThemeManager, GradientTheme } from '../../core/tasks/gradients';
import Routine from '../../services/database/models/Routine';

interface RoutineCardProps {
  routine: Routine;
  onPress: () => void;
  onLongPress?: () => void;
  gradient?: GradientTheme;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = screenWidth - (CARD_MARGIN * 2);

const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  onPress,
  onLongPress,
  gradient,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Get gradient colors
  const selectedGradient = gradient || GradientThemeManager.getGradientById(routine.color) || GradientThemeManager.getGradientById('ocean');
  const colors = selectedGradient?.colors || ['#7DD3FC', '#0EA5E9'];
  
  // Calculate progress based on completed tasks
  const [linkedTasksCount, setLinkedTasksCount] = React.useState(0);
  const [completedTasksCount, setCompletedTasksCount] = React.useState(0);
  
  React.useEffect(() => {
    // Load task counts
    const loadTaskCounts = async () => {
      try {
        const tasks = await routine.tasks.fetch();
        setLinkedTasksCount(tasks.length);
        const completed = tasks.filter((task: any) => task.isCompleted).length;
        setCompletedTasksCount(completed);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadTaskCounts();
  }, [routine]);
  
  const progress = useMemo(() => {
    if (linkedTasksCount === 0) return 0;
    return (completedTasksCount / linkedTasksCount) * 100;
  }, [linkedTasksCount, completedTasksCount]);
  
  // Format next occurrence
  const nextOccurrence = useMemo(() => {
    if (routine.isCompletedToday) {
      return 'Completed today';
    }
    
    const scheduleConfig = routine.scheduleConfig;
    const now = new Date();
    
    switch (routine.scheduleType) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return `Tomorrow, ${scheduleConfig.time || '6:00 AM'}`;
        
      case 'weekly':
        const days = scheduleConfig.days || [];
        const currentDay = now.getDay();
        let nextDay = days.find(d => d > currentDay);
        
        if (!nextDay) {
          nextDay = days[0]; // Next week
        }
        
        const daysUntilNext = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + daysUntilNext);
        
        const dayName = nextDate.toLocaleDateString('en-US', { weekday: 'long' });
        return `${dayName}, ${scheduleConfig.time || '6:00 AM'}`;
        
      case 'monthly':
        const dates = scheduleConfig.dates || [];
        const currentDate = now.getDate();
        let nextDateNum = dates.find(d => d > currentDate);
        
        if (!nextDateNum) {
          nextDateNum = dates[0]; // Next month
        }
        
        const nextMonthDate = new Date(now);
        if (nextDateNum <= currentDate) {
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        }
        nextMonthDate.setDate(nextDateNum);
        
        return nextMonthDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }) + `, ${scheduleConfig.time || '6:00 AM'}`;
        
      case 'custom':
        const interval = scheduleConfig.interval || 1;
        const unit = scheduleConfig.unit || 'days';
        const lastCompleted = routine.lastCompleted ? new Date(routine.lastCompleted) : now;
        const nextCustom = new Date(lastCompleted);
        
        switch (unit) {
          case 'days':
            nextCustom.setDate(nextCustom.getDate() + interval);
            break;
          case 'weeks':
            nextCustom.setDate(nextCustom.getDate() + (interval * 7));
            break;
          case 'months':
            nextCustom.setMonth(nextCustom.getMonth() + interval);
            break;
        }
        
        if (nextCustom <= now) {
          return 'Due now';
        }
        
        const diffDays = Math.ceil((nextCustom.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          return `Tomorrow, ${scheduleConfig.time || '6:00 AM'}`;
        } else if (diffDays <= 7) {
          return nextCustom.toLocaleDateString('en-US', { weekday: 'long' }) + `, ${scheduleConfig.time || '6:00 AM'}`;
        } else {
          return nextCustom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${scheduleConfig.time || '6:00 AM'}`;
        }
        
      default:
        return 'Not scheduled';
    }
  }, [routine]);
  
  // Get routine icon (default to repeat icon if not specified)
  const routineIcon = routine.icon || '🔄';
  
  // Handle press animations
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);
  
  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);
  
  // Streak emoji based on status
  const streakEmoji = routine.streakStatus === 'active' ? '⚡' : 
                     routine.streakStatus === 'at_risk' ? '🔥' : '';
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.icon}>{routineIcon}</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {routine.name}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.statsIcon}>📊</Text>
                <Text style={styles.statsIcon}>🎯</Text>
              </View>
            </View>
            
            {/* Info row */}
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                {linkedTasksCount} tasks
              </Text>
              {/* TODO: Add linked goals count when available */}
              <Text style={styles.infoDot}>•</Text>
              <Text style={styles.infoText}>
                2 goals linked
              </Text>
            </View>
            
            {/* Streak row */}
            {routine.currentStreak > 0 && (
              <View style={styles.streakRow}>
                <Text style={styles.streakText}>
                  {streakEmoji} Current streak: {routine.currentStreak} days
                </Text>
              </View>
            )}
            
            {/* Next occurrence */}
            <View style={styles.nextRow}>
              <Text style={styles.nextIcon}>📅</Text>
              <Text style={styles.nextText}>
                Next: {nextOccurrence}
              </Text>
            </View>
            
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

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
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statsIcon: {
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoDot: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 6,
  },
  streakRow: {
    marginBottom: 6,
  },
  streakText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  nextText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default React.memo(RoutineCard);
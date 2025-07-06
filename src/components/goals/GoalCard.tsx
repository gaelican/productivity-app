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
import { GradientSystem, Gradient, gradientThemes } from '../../packages/design-system';
import Goal from '../../services/database/models/Goal';

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
  onLongPress?: () => void;
  onQuickIncrement?: () => void;
  gradient?: Gradient;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = screenWidth - (CARD_MARGIN * 2);

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onPress,
  onLongPress,
  onQuickIncrement,
  gradient,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Get gradient colors
  const selectedGradient = gradient || GradientSystem.getGradientById(goal.color || 'blue') || GradientSystem.getDefaultGradient();
  const colors = GradientSystem.getColorsArray(selectedGradient);
  
  // Format display values
  const formatValue = useCallback((value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  }, []);
  
  // Calculate days until target
  const daysUntilTarget = useMemo(() => {
    if (!goal.targetDate) return null;
    const days = goal.daysUntilTarget;
    if (days === null) return null;
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }, [goal.targetDate, goal.daysUntilTarget]);
  
  // Animation handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);
  
  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);
  
  // Quick increment animation
  const handleQuickIncrement = useCallback(() => {
    if (onQuickIncrement) {
      // Bounce animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          useNativeDriver: true,
          speed: 50,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
        }),
      ]).start();
      
      onQuickIncrement();
    }
  }, [scaleAnim, onQuickIncrement]);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          width: CARD_WIDTH,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.icon}>{goal.icon}</Text>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text style={styles.category}>{goal.category}</Text>
              </View>
            </View>
            {goal.isActive && (
              <TouchableOpacity
                style={styles.quickIncrementButton}
                onPress={handleQuickIncrement}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.quickIncrementText}>
                  +{goal.defaultIncrement}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressValue}>
                {formatValue(goal.currentValue)} / {formatValue(goal.targetValue)}
              </Text>
              <Text style={styles.progressUnit}>{goal.unit}</Text>
            </View>
            <Text style={styles.progressPercentage}>{goal.progressPercentage}%</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, goal.progressPercentage)}%`,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                ]}
              />
            </View>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, styles[`status_${goal.status}`]]}>
              <Text style={styles.statusText}>
                {goal.status === 'active' && '🎯'}
                {goal.status === 'paused' && '⏸️'}
                {goal.status === 'completed' && '✅'}
                {goal.status === 'archived' && '📦'}
                {' '}{goal.status}
              </Text>
            </View>
            
            {/* Target Date */}
            {daysUntilTarget && (
              <View style={styles.targetDate}>
                <Text style={[
                  styles.targetDateText,
                  goal.isOverdue && styles.overdueText
                ]}>
                  {goal.isOverdue ? '⚠️ ' : '📅 '}
                  {daysUntilTarget}
                </Text>
              </View>
            )}
            
            {/* Average Progress */}
            {goal.averageDailyProgress > 0 && (
              <View style={styles.avgProgress}>
                <Text style={styles.avgProgressText}>
                  📈 {formatValue(goal.averageDailyProgress)}/day
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: CARD_MARGIN,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  quickIncrementButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickIncrementText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_active: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  status_paused: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  status_completed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  status_archived: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  targetDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDateText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  overdueText: {
    color: '#FEE2E2',
    fontWeight: '600',
  },
  avgProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgProgressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default GoalCard;
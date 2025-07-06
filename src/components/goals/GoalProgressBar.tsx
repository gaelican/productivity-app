import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GoalProgressBarProps {
  currentValue: number;
  targetValue: number;
  unit?: string;
  showLabels?: boolean;
  height?: number;
  animated?: boolean;
  gradientColors?: string[];
  backgroundColor?: string;
  style?: ViewStyle;
}

const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  currentValue,
  targetValue,
  unit = '',
  showLabels = true,
  height = 24,
  animated = true,
  gradientColors = ['#10B981', '#34D399'],
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  style,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
  
  // Animate progress on mount and value changes
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progressPercentage,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progressPercentage);
    }
  }, [progressPercentage, animated]);
  
  // Format numbers for display
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };
  
  return (
    <View style={[styles.container, style]}>
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={styles.currentValue}>
            {formatValue(currentValue)} {unit}
          </Text>
          <Text style={styles.percentage}>{progressPercentage.toFixed(0)}%</Text>
          <Text style={styles.targetValue}>
            {formatValue(targetValue)} {unit}
          </Text>
        </View>
      )}
      
      <View style={[styles.progressBarContainer, { height }]}>
        <View style={[styles.progressBarBackground, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.progressBarFillContainer,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarFill}
            >
              {height >= 20 && progressPercentage > 10 && (
                <Text style={styles.progressBarText}>
                  {formatValue(currentValue)}
                </Text>
              )}
            </LinearGradient>
          </Animated.View>
          
          {/* Milestone markers */}
          {[25, 50, 75].map((milestone) => (
            <View
              key={milestone}
              style={[
                styles.milestoneMarker,
                { left: `${milestone}%` },
                progressPercentage >= milestone && styles.milestoneReached,
              ]}
            />
          ))}
        </View>
      </View>
      
      {/* Milestone indicators */}
      {showLabels && (
        <View style={styles.milestonesContainer}>
          {[0, 25, 50, 75, 100].map((milestone) => (
            <Text
              key={milestone}
              style={[
                styles.milestoneText,
                progressPercentage >= milestone && styles.milestoneTextReached,
              ]}
            >
              {milestone}%
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Circular Progress Variant - Simplified without SVG
export const GoalCircularProgress: React.FC<{
  currentValue: number;
  targetValue: number;
  size?: number;
  strokeWidth?: number;
  gradientColors?: string[];
  showPercentage?: boolean;
}> = ({
  currentValue,
  targetValue,
  size = 120,
  strokeWidth = 12,
  gradientColors = ['#10B981', '#34D399'],
  showPercentage = true,
}) => {
  const progressPercentage = Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
  
  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[
        styles.circularRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }
      ]} />
      
      {/* Progress ring (visual approximation) */}
      <View style={[
        styles.circularProgress,
        {
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: gradientColors[0],
          opacity: progressPercentage / 100,
        }
      ]} />
      
      {showPercentage && (
        <View style={styles.circularTextContainer}>
          <Text style={styles.circularPercentage}>
            {progressPercentage.toFixed(0)}%
          </Text>
          <Text style={styles.circularLabel}>Complete</Text>
        </View>
      )}
    </View>
  );
};

// Mini Progress Bar for inline use
export const GoalMiniProgress: React.FC<{
  currentValue: number;
  targetValue: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({
  currentValue,
  targetValue,
  width = 60,
  height = 4,
  color = '#10B981',
}) => {
  const progressPercentage = Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
  
  return (
    <View style={[styles.miniContainer, { width, height }]}>
      <View style={styles.miniBackground}>
        <View
          style={[
            styles.miniFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

// Note: Circular progress simplified without SVG dependencies

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
    borderRadius: 12,
    position: 'relative',
  },
  progressBarFillContainer: {
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  milestoneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  milestoneReached: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  milestonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  milestoneText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  milestoneTextReached: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  // Circular progress styles
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularRing: {
    position: 'absolute',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  circularPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circularLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Mini progress styles
  miniContainer: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default GoalProgressBar;
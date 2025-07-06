import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeviceTierDetector } from '../../services/device/DeviceTierDetector';

interface RoutineTimerProps {
  startTime: number; // Timestamp when timer started
  duration: number; // Required duration in seconds
  onComplete?: () => void;
  isPaused?: boolean;
  style?: any;
}

export const RoutineTimer: React.FC<RoutineTimerProps> = React.memo(({
  startTime,
  duration,
  onComplete,
  isPaused = false,
  style,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const deviceTier = DeviceTierDetector.getDeviceTier();
  
  // Update intervals based on device tier for battery efficiency
  const getUpdateInterval = useCallback(() => {
    switch (deviceTier) {
      case 'premium':
        return 1000; // 1 second updates
      case 'standard':
        return 5000; // 5 second updates
      case 'basic':
      default:
        return 15000; // 15 second updates
    }
  }, [deviceTier]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const updateTimer = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - startTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    
    setElapsed(elapsedSec);
    
    // Check if timer is complete
    if (elapsedSec >= duration && onComplete) {
      onComplete();
    }
  }, [startTime, duration, onComplete]);

  useEffect(() => {
    if (isPaused) {
      // Clear interval when paused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial update
    updateTimer();

    // Set up interval based on device tier
    const interval = getUpdateInterval();
    intervalRef.current = setInterval(updateTimer, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, updateTimer, getUpdateInterval]);

  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(1, elapsed / duration);
  const isComplete = elapsed >= duration;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.timeText, isComplete && styles.completeText]}>
        {isComplete ? '✓' : `${formatTime(elapsed)}/${formatTime(duration)}`}
      </Text>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progress * 100}%` },
            isComplete && styles.completeBar
          ]} 
        />
      </View>
    </View>
  );
});

RoutineTimer.displayName = 'RoutineTimer';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  completeText: {
    color: '#10B981',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  completeBar: {
    backgroundColor: '#10B981',
  },
});
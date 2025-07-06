import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { TaskCard } from './core/tasks/TaskCard';
import { deviceTierDetector } from './services/device/DeviceTierDetector';
import { Task, DeviceTier } from './packages/types';
import WidgetSyncIndicator from './components/WidgetSyncIndicator.web';

// Mock data for demo
const mockTasks: Task[] = [
  {
    id: 'task_1',
    name: 'Buy milk',
    description: 'Get organic whole milk',
    icon: '🥛',
    color: 'blue',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    dueTime: '17:00',
    isCompleted: false,
    progress: 0,
    tags: ['grocery', 'shopping'],
    userId: 'user_1',
    deviceId: 'web_demo',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task_2',
    name: 'Finish presentation',
    description: 'Complete slides for Monday meeting',
    icon: '📊',
    color: 'purple',
    priority: 'high',
    dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
    isCompleted: false,
    progress: 65,
    tags: ['work', 'urgent'],
    userId: 'user_1',
    deviceId: 'web_demo',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task_3',
    name: 'Morning workout',
    description: '30 minutes cardio + stretching',
    icon: '🏃',
    color: 'green',
    priority: 'low',
    isCompleted: true,
    completedAt: new Date(),
    progress: 100,
    tags: ['health', 'routine'],
    userId: 'user_1',
    deviceId: 'web_demo',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('premium');
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    // Update device tier detection
    const detected = deviceTierDetector.detectTier();
    setDeviceTier(detected);
  }, []);

  const handleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, isCompleted: !task.isCompleted, completedAt: new Date() }
        : task
    ));
  };

  const handleTaskPress = (taskId: string) => {
    console.log('Task pressed:', taskId);
  };

  const cycleDeviceTier = () => {
    const tiers: DeviceTier[] = ['basic', 'standard', 'premium'];
    const currentIndex = tiers.indexOf(deviceTier);
    const nextIndex = (currentIndex + 1) % tiers.length;
    setDeviceTier(tiers[nextIndex]);
  };

  const adjustBattery = (delta: number) => {
    setBatteryLevel(prev => Math.max(0, Math.min(100, prev + delta)));
  };

  return (
    <View style={styles.container}>
      {/* Debug Panel */}
      {showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Demo Controls</Text>
          
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Device Tier:</Text>
            <TouchableOpacity 
              style={[styles.debugButton, styles[`tier${deviceTier}`]]}
              onPress={cycleDeviceTier}
            >
              <Text style={styles.debugButtonText}>{deviceTier.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Battery:</Text>
            <View style={styles.batteryControls}>
              <TouchableOpacity 
                style={styles.smallButton}
                onPress={() => adjustBattery(-10)}
              >
                <Text style={styles.buttonText}>-10%</Text>
              </TouchableOpacity>
              <Text style={[
                styles.batteryLevel,
                batteryLevel < 20 && styles.batteryLow,
                batteryLevel < 30 && batteryLevel >= 20 && styles.batteryMedium,
              ]}>
                {batteryLevel}%
              </Text>
              <TouchableOpacity 
                style={styles.smallButton}
                onPress={() => adjustBattery(10)}
              >
                <Text style={styles.buttonText}>+10%</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.debugInfo}>
            <Text style={styles.infoText}>
              Animations: {batteryLevel < 20 ? 'Disabled (Low Battery)' : deviceTier === 'basic' ? 'Disabled' : 'Enabled'}
            </Text>
            <Text style={styles.infoText}>
              Gradients: {deviceTier === 'basic' ? '10' : deviceTier === 'standard' ? '20' : '30'}
            </Text>
            <Text style={styles.infoText}>
              Platform: {Platform.OS} (Web Demo)
            </Text>
          </View>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Productivity App Demo</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowDebug(!showDebug)}
        >
          <Text style={styles.toggleText}>{showDebug ? 'Hide' : 'Show'} Debug</Text>
        </TouchableOpacity>
      </View>
      
      {/* Widget Sync Indicator */}
      <WidgetSyncIndicator />
      
      {/* Task List */}
      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={() => handleTaskPress(task.id)}
            onComplete={() => handleTaskComplete(task.id)}
            onEdit={() => {
              console.log('Edit task:', task.id);
              alert(`Edit task: ${task.name}`);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  debugPanel: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
  },
  debugTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  debugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugLabel: {
    color: '#9ca3af',
    fontSize: 14,
    width: 100,
  },
  debugButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4b5563',
  },
  tierbasic: {
    backgroundColor: '#6b7280',
  },
  tierstandard: {
    backgroundColor: '#3b82f6',
  },
  tierpremium: {
    backgroundColor: '#a855f7',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  batteryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  batteryLevel: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  batteryLow: {
    color: '#ef4444',
  },
  batteryMedium: {
    color: '#f59e0b',
  },
  debugInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    color: '#4b5563',
  },
  taskList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
});
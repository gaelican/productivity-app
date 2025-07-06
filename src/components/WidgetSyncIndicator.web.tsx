import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAllTasks } from '../packages/state';

interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  taskCount: number;
}

export const WidgetSyncIndicator: React.FC = () => {
  const tasks = useSelector(selectAllTasks);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    taskCount: 0,
  });

  useEffect(() => {
    // Simulate widget sync connection
    const checkWidgetConnection = () => {
      const isConnected = window.location.hostname === 'localhost';
      setSyncStatus({
        isConnected,
        lastSync: new Date(),
        taskCount: tasks.length,
      });

      // Log sync activity to console for debugging
      console.log('[Widget Sync]', {
        isConnected,
        taskCount: tasks.length,
        timestamp: new Date().toISOString(),
        tasks: tasks.map(t => ({ id: t.id, title: t.title, done: t.done })),
      });
    };

    // Check immediately and then every 5 seconds
    checkWidgetConnection();
    const interval = setInterval(checkWidgetConnection, 5000);

    return () => clearInterval(interval);
  }, [tasks]);

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return 'Never';
    const seconds = Math.floor((new Date().getTime() - syncStatus.lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, syncStatus.isConnected ? styles.connected : styles.disconnected]} />
      <View style={styles.info}>
        <Text style={styles.label}>Widget Sync</Text>
        <Text style={styles.status}>
          {syncStatus.isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        <Text style={styles.details}>
          {syncStatus.taskCount} tasks • {formatLastSync()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  details: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
});

export default WidgetSyncIndicator;
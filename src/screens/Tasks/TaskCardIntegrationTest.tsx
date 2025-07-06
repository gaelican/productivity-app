import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TaskListScreen } from './TaskListScreen';

// Simple test component to verify TaskCard integration
export const TaskCardIntegrationTest = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TaskCard Integration Test</Text>
      <View style={styles.taskListContainer}>
        <TaskListScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  taskListContainer: {
    flex: 1,
  },
});
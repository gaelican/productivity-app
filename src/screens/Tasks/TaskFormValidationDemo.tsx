import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { TaskForm } from '../../components/tasks/TaskForm';

/**
 * Demo screen to showcase the TaskForm with Yup validation
 * 
 * Validation Rules:
 * - Task name: Required, 1-100 characters
 * - Description: Optional, max 500 characters  
 * - Notes: Optional, max 1000 characters
 * - Priority: Required, must be low/medium/high/urgent
 * - Progress: Required, 0-100
 * - Due date: Optional, must be future date for new tasks
 * - Tags: Required, 1-10 tags
 */
export const TaskFormValidationDemo: React.FC = () => {
  const handleCreateTask = async (data: any) => {
    console.log('Creating task with validated data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleEditTask = async (data: any) => {
    console.log('Updating task with validated data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Task Form Validation Demo</Text>
        <Text style={styles.subtitle}>Try submitting with invalid data to see validation errors</Text>
        
        <View style={styles.formContainer}>
          <TaskForm
            mode="create"
            onSubmit={handleCreateTask}
            onCancel={() => console.log('Cancelled')}
            initialValues={{
              priority: 'medium',
              tags: [], // Will show validation error - at least 1 tag required
              progress: 0,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
});
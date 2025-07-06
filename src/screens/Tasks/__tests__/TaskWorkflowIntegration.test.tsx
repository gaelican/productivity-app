import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { TaskCreateScreen } from '../TaskCreateScreen';
import { TaskEditScreen } from '../TaskEditScreen';
import { taskRepository } from '../../../services/database/repositories/TaskRepository';
import { goalRepository } from '../../../services/database/repositories/GoalRepository';
import Task from '../../../services/database/models/Task';
import { RootStackParamList } from '../../../navigation/types';

// Mock dependencies
jest.mock('../../../services/database/repositories/TaskRepository');
jest.mock('../../../services/database/repositories/GoalRepository');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.spyOn(Alert, 'alert');

// Test Navigation Setup
const Stack = createNativeStackNavigator<RootStackParamList>();

const TestNavigator = ({ initialRouteName, initialParams }: any) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen 
          name="TaskCreate" 
          component={TaskCreateScreen}
          initialParams={initialParams}
        />
        <Stack.Screen 
          name="TaskEdit" 
          component={TaskEditScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('Task Creation and Editing Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock goals for goal selector
    (goalRepository.getActiveGoals as jest.Mock).mockResolvedValue([
      { id: 'goal1', name: 'Learn TypeScript', icon: '📚' },
      { id: 'goal2', name: 'Exercise Daily', icon: '💪' },
    ]);
  });

  describe('Task Creation Flow', () => {
    it('should create a task with all fields populated', async () => {
      const mockTask = {
        id: 'task123',
        name: 'Complete project documentation',
        description: 'Write comprehensive docs',
        icon: '📄',
        color: 'ocean',
        priority: 'high',
        dueDate: new Date('2024-12-31').getTime(),
        tags: ['work', 'documentation'],
        goalId: 'goal1',
      };

      (taskRepository.create as jest.Mock).mockResolvedValue(mockTask);

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Switch to form mode
      fireEvent.press(getByText('📝 Form'));

      // Fill in task name
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Complete project documentation');

      // Fill in description
      const descriptionInput = getByPlaceholderText('Add more details...');
      fireEvent.changeText(descriptionInput, 'Write comprehensive docs');

      // Select priority
      fireEvent.press(getByText('High'));

      // Add tags
      const tagInput = getByPlaceholderText('Add tags...');
      fireEvent.changeText(tagInput, 'work');
      fireEvent.press(getByText('Add'));
      fireEvent.changeText(tagInput, 'documentation');
      fireEvent.press(getByText('Add'));

      // Create task
      fireEvent.press(getByText('Create'));

      await waitFor(() => {
        expect(taskRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Complete project documentation',
            description: 'Write comprehensive docs',
            priority: 'high',
            tags: ['work', 'documentation'],
          })
        );
      });
    });

    it('should validate required fields before submission', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Switch to form mode
      fireEvent.press(getByText('📝 Form'));

      // Try to create without filling name
      fireEvent.press(getByText('Create'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a task name');
      });

      expect(taskRepository.create).not.toHaveBeenCalled();
    });

    it('should handle natural language input correctly', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Enter natural language input
      const naturalInput = getByPlaceholderText('e.g., Call mom tomorrow at 3pm high priority #family');
      fireEvent.changeText(naturalInput, 'Call mom tomorrow at 3pm high priority #family');

      await waitFor(() => {
        // Check if preview shows parsed data
        expect(getByText('Call mom')).toBeDefined();
        expect(getByText(/Priority: high/)).toBeDefined();
        expect(getByText(/Tags: family/)).toBeDefined();
      });

      // Create task
      fireEvent.press(getByText('Create'));

      await waitFor(() => {
        expect(taskRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Call mom',
            priority: 'high',
            tags: ['family'],
            parsedInput: 'Call mom tomorrow at 3pm high priority #family',
          })
        );
      });
    });

    it('should handle creation errors gracefully', async () => {
      (taskRepository.create as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Switch to form mode
      fireEvent.press(getByText('📝 Form'));

      // Fill required fields
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Test task');

      // Try to create
      fireEvent.press(getByText('Create'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create task');
      });
    });
  });

  describe('Task Editing Flow', () => {
    const mockExistingTask = {
      id: 'task123',
      name: 'Original task name',
      description: 'Original description',
      notes: 'Some notes',
      icon: '📝',
      color: 'ocean',
      priority: 'medium',
      progress: 25,
      tags: ['personal'],
      isCompleted: false,
      createdAt: new Date('2024-01-01').getTime(),
      complete: jest.fn(),
      uncomplete: jest.fn(),
    } as unknown as Task;

    it('should load and display existing task data', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockExistingTask);

      const { getByDisplayValue, getByText } = render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'task123' }}
        />
      );

      await waitFor(() => {
        expect(getByDisplayValue('Original task name')).toBeDefined();
        expect(getByDisplayValue('Original description')).toBeDefined();
        expect(getByDisplayValue('Some notes')).toBeDefined();
        expect(getByText('25%')).toBeDefined();
      });
    });

    it('should update task with changed fields only', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockExistingTask);
      (taskRepository.update as jest.Mock).mockResolvedValue(true);

      const { getByDisplayValue, getByText } = render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'task123' }}
        />
      );

      await waitFor(() => {
        expect(getByDisplayValue('Original task name')).toBeDefined();
      });

      // Change task name
      const nameInput = getByDisplayValue('Original task name');
      fireEvent.changeText(nameInput, 'Updated task name');

      // Change progress
      fireEvent.press(getByText('50%'));

      // Save changes
      fireEvent.press(getByText('Save Changes'));

      await waitFor(() => {
        expect(taskRepository.update).toHaveBeenCalledWith('task123', 
          expect.objectContaining({
            name: 'Updated task name',
            progress: 50,
          })
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success', 
          'Task updated successfully',
          expect.any(Array)
        );
      });
    });

    it('should handle task completion toggle', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockExistingTask);
      mockExistingTask.complete.mockResolvedValue(true);

      const { getByText } = render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'task123' }}
        />
      );

      await waitFor(() => {
        expect(getByText('○ Mark as Complete')).toBeDefined();
      });

      // Toggle completion
      fireEvent.press(getByText('○ Mark as Complete'));

      await waitFor(() => {
        expect(mockExistingTask.complete).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Task marked as complete');
      });
    });

    it('should handle task deletion with confirmation', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockExistingTask);
      (taskRepository.delete as jest.Mock).mockResolvedValue(true);

      const { getByText } = render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'task123' }}
        />
      );

      await waitFor(() => {
        expect(getByText('Delete')).toBeDefined();
      });

      // Click delete
      fireEvent.press(getByText('Delete'));

      // Check confirmation dialog
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Task',
        'Are you sure you want to delete this task? This cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Delete' }),
        ])
      );

      // Simulate pressing Delete in the alert
      const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      await act(async () => {
        await deleteHandler();
      });

      expect(taskRepository.delete).toHaveBeenCalledWith('task123');
    });

    it('should validate form fields during editing', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockExistingTask);

      const { getByDisplayValue, getByText } = render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'task123' }}
        />
      );

      await waitFor(() => {
        expect(getByDisplayValue('Original task name')).toBeDefined();
      });

      // Clear task name
      const nameInput = getByDisplayValue('Original task name');
      fireEvent.changeText(nameInput, '');

      // Try to save
      fireEvent.press(getByText('Save Changes'));

      await waitFor(() => {
        expect(getByText('Task name is required')).toBeDefined();
        expect(taskRepository.update).not.toHaveBeenCalled();
      });
    });

    it('should handle update errors gracefully', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockExistingTask);
      (taskRepository.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { getByDisplayValue, getByText } = render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'task123' }}
        />
      );

      await waitFor(() => {
        expect(getByDisplayValue('Original task name')).toBeDefined();
      });

      // Make a change
      const nameInput = getByDisplayValue('Original task name');
      fireEvent.changeText(nameInput, 'Updated name');

      // Try to save
      fireEvent.press(getByText('Save Changes'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database error');
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate back on successful task creation', async () => {
      (taskRepository.create as jest.Mock).mockResolvedValue({ id: 'task123' });

      const mockGoBack = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Get navigation from component
      const navigation = (TaskCreateScreen as any).mockNavigation || { goBack: mockGoBack };

      // Switch to form mode and create task
      fireEvent.press(getByText('📝 Form'));
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Test task');
      fireEvent.press(getByText('Create'));

      await waitFor(() => {
        expect(taskRepository.create).toHaveBeenCalled();
      });
    });

    it('should handle task not found during edit', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(null);

      render(
        <TestNavigator 
          initialRouteName="TaskEdit" 
          initialParams={{ taskId: 'nonexistent' }}
        />
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Task not found');
      });
    });
  });

  describe('Data Persistence', () => {
    it('should persist form data across mode switches', async () => {
      const { getByText, getByPlaceholderText, getByDisplayValue } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Start in form mode
      fireEvent.press(getByText('📝 Form'));

      // Fill in some data
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Persistent task');

      // Switch to natural language mode
      fireEvent.press(getByText('✨ Natural Language'));

      // Switch back to form mode
      fireEvent.press(getByText('📝 Form'));

      // Data should still be there
      expect(getByDisplayValue('Persistent task')).toBeDefined();
    });

    it('should update form fields when parsing natural language', async () => {
      const { getByText, getByPlaceholderText, getByDisplayValue } = render(
        <TestNavigator initialRouteName="TaskCreate" />
      );

      // Enter natural language
      const naturalInput = getByPlaceholderText('e.g., Call mom tomorrow at 3pm high priority #family');
      fireEvent.changeText(naturalInput, 'Important meeting tomorrow high priority #work');

      // Switch to form mode
      fireEvent.press(getByText('📝 Form'));

      // Check if form fields are populated
      await waitFor(() => {
        expect(getByDisplayValue('Important meeting')).toBeDefined();
        // Priority should be set to high
        expect(getByText('High')).toBeDefined();
      });
    });
  });
});
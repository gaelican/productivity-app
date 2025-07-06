import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { TaskEditScreen } from '../TaskEditScreen';
import { taskRepository } from '../../../services/database/repositories/TaskRepository';
import Task from '../../../services/database/models/Task';

// Mock dependencies
jest.mock('../../../services/database/repositories/TaskRepository');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

// Mock route
const mockRoute = {
  params: {
    taskId: 'test-task-id',
  },
};

// Mock task data
const mockTask = {
  id: 'test-task-id',
  name: 'Test Task',
  description: 'Test Description',
  notes: 'Test Notes',
  icon: '📝',
  color: 'ocean',
  priority: 'medium',
  dueDate: Date.now(),
  tags: ['test', 'task'],
  goalId: 'test-goal-id',
  progress: 50,
  isCompleted: false,
  createdAt: Date.now(),
  complete: jest.fn(),
  uncomplete: jest.fn(),
} as unknown as Task;

describe('TaskEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (taskRepository.findById as jest.Mock).mockResolvedValue(mockTask);
    (taskRepository.update as jest.Mock).mockResolvedValue(mockTask);
    (taskRepository.delete as jest.Mock).mockResolvedValue(undefined);
  });

  it('should load and display task data', async () => {
    const { getByDisplayValue, getByText } = render(
      <TaskEditScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByDisplayValue('Test Task')).toBeTruthy();
      expect(getByDisplayValue('Test Description')).toBeTruthy();
      expect(getByDisplayValue('Test Notes')).toBeTruthy();
      expect(getByText('Progress: 50%')).toBeTruthy();
    });
  });

  it('should update task with all fields including goalId', async () => {
    const { getByDisplayValue, getByText } = render(
      <TaskEditScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByDisplayValue('Test Task')).toBeTruthy();
    });

    // Change task name
    const nameInput = getByDisplayValue('Test Task');
    fireEvent.changeText(nameInput, 'Updated Task Name');

    // Save changes
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(taskRepository.update).toHaveBeenCalledWith('test-task-id', expect.objectContaining({
        name: 'Updated Task Name',
        description: 'Test Description',
        notes: 'Test Notes',
        icon: '📝',
        color: 'ocean',
        priority: 'medium',
        dueDate: expect.any(Number),
        tags: ['test', 'task'],
        progress: 50,
        goalId: 'test-goal-id',
      }));
    });

    // Should show success alert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Task updated successfully',
      expect.any(Array)
    );
  });

  it('should handle task completion toggle', async () => {
    const { getByText } = render(
      <TaskEditScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('○ Mark as Complete')).toBeTruthy();
    });

    const completeButton = getByText('○ Mark as Complete');
    fireEvent.press(completeButton);

    await waitFor(() => {
      expect(mockTask.complete).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Task marked as complete');
    });
  });

  it('should handle task deletion', async () => {
    const { getByText } = render(
      <TaskEditScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('🗑 Delete Task')).toBeTruthy();
    });

    const deleteButton = getByText('🗑 Delete Task');
    fireEvent.press(deleteButton);

    // Should show confirmation alert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Task',
      'Are you sure you want to delete this task? This cannot be undone.',
      expect.any(Array)
    );

    // Simulate pressing delete in the alert
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    await deleteCallback();

    await waitFor(() => {
      expect(taskRepository.delete).toHaveBeenCalledWith('test-task-id');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Task deleted successfully',
        expect.any(Array)
      );
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Database error';
    (taskRepository.update as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { getByDisplayValue, getByText } = render(
      <TaskEditScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByDisplayValue('Test Task')).toBeTruthy();
    });

    // Change task name and save
    const nameInput = getByDisplayValue('Test Task');
    fireEvent.changeText(nameInput, 'Updated Task Name');
    
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        errorMessage,
        expect.any(Array)
      );
    });
  });

  it('should not allow double update when saving is in progress', async () => {
    const { getByText } = render(
      <TaskEditScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy();
    });

    // Make update take time
    (taskRepository.update as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    const saveButton = getByText('Save');
    
    // First save
    fireEvent.press(saveButton);
    
    // Try to save again immediately
    fireEvent.press(saveButton);

    // Should only call update once
    expect(taskRepository.update).toHaveBeenCalledTimes(1);
  });
});
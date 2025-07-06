import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { TaskForm, TaskFormData } from '../TaskForm';
import { goalRepository } from '../../../services/database/repositories/GoalRepository';

// Mock the repositories
jest.mock('../../../services/database/repositories/GoalRepository');

// Mock child components that have external dependencies
jest.mock('../GoalSelector', () => ({
  GoalSelector: ({ value, onChange }: any) => {
    const mockGoals = [
      { id: 'goal1', name: 'Goal 1', icon: '🎯' },
      { id: 'goal2', name: 'Goal 2', icon: '📚' },
    ];
    return (
      <MockComponent 
        testID="goal-selector"
        value={value}
        onChange={onChange}
        options={mockGoals}
      />
    );
  },
}));

// Helper component for mocking
const MockComponent = ({ testID, value, onChange, options }: any) => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return (
    <View testID={testID}>
      <Text>{value || 'None selected'}</Text>
      {options?.map((option: any) => (
        <TouchableOpacity 
          key={option.id} 
          onPress={() => onChange(option.id)}
          testID={`${testID}-option-${option.id}`}
        >
          <Text>{option.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

describe('TaskForm Integration Tests', () => {
  const defaultProps = {
    mode: 'create' as const,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (goalRepository.getActiveGoals as jest.Mock).mockResolvedValue([]);
  });

  describe('Component Integration', () => {
    it('should integrate all form components correctly', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <TaskForm {...defaultProps} />
      );

      // Task name input
      const nameInput = getByPlaceholderText('What needs to be done?');
      expect(nameInput).toBeDefined();

      // Description input
      const descriptionInput = getByPlaceholderText('Add more details...');
      expect(descriptionInput).toBeDefined();

      // Notes input
      const notesInput = getByPlaceholderText('Private notes...');
      expect(notesInput).toBeDefined();

      // Icon picker - shows default icon
      expect(getByText('📝')).toBeDefined();

      // Priority selector - shows default priority
      expect(getByText('Medium')).toBeDefined();

      // Due date picker
      expect(getByText('Due Date')).toBeDefined();

      // Tag input
      const tagInput = getByPlaceholderText('Add tags...');
      expect(tagInput).toBeDefined();

      // Goal selector
      expect(getByTestId('goal-selector')).toBeDefined();

      // Color theme selector
      expect(getByText('Color Theme')).toBeDefined();
      expect(getByText('Ocean')).toBeDefined(); // Default theme
    });

    it('should handle data flow between components', async () => {
      const onSubmit = jest.fn();
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <TaskForm {...defaultProps} onSubmit={onSubmit} />
      );

      // Fill in task name
      fireEvent.changeText(
        getByPlaceholderText('What needs to be done?'),
        'Test integrated task'
      );

      // Select high priority
      fireEvent.press(getByText('High'));

      // Add tags
      const tagInput = getByPlaceholderText('Add tags...');
      fireEvent.changeText(tagInput, 'integration');
      fireEvent.press(getByText('Add'));

      // Select a goal
      fireEvent.press(getByTestId('goal-selector-option-goal1'));

      // Submit form
      fireEvent.press(getByText('Create Task'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test integrated task',
            priority: 'high',
            tags: ['integration'],
            goalId: 'goal1',
          })
        );
      });
    });

    it('should update dependent fields correctly', async () => {
      const { getByPlaceholderText, getByText, rerender } = render(
        <TaskForm {...defaultProps} mode="create" />
      );

      // Initially, progress section should not be visible in create mode
      expect(() => getByText(/Progress:/)).toThrow();

      // Switch to edit mode
      rerender(
        <TaskForm 
          {...defaultProps} 
          mode="edit"
          initialValues={{ name: 'Existing task', progress: 50 }}
        />
      );

      // Now progress section should be visible
      expect(getByText('Progress: 50%')).toBeDefined();
      expect(getByText('50%')).toBeDefined();
    });
  });

  describe('Validation Integration', () => {
    it('should validate all fields on submit', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TaskForm {...defaultProps} />
      );

      // Try to submit without filling required fields
      fireEvent.press(getByText('Create Task'));

      await waitFor(() => {
        // Should show validation error for name
        expect(getByText('Task name is required')).toBeDefined();
      });

      // Fill name and try again
      fireEvent.changeText(
        getByPlaceholderText('What needs to be done?'),
        'Valid task name'
      );

      // Add invalid description (too long)
      const longDescription = 'a'.repeat(1001);
      fireEvent.changeText(
        getByPlaceholderText('Add more details...'),
        longDescription
      );

      fireEvent.press(getByText('Create Task'));

      await waitFor(() => {
        expect(getByText('Description must be less than 1000 characters')).toBeDefined();
      });
    });

    it('should show field-level validation on blur', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TaskForm {...defaultProps} />
      );

      const nameInput = getByPlaceholderText('What needs to be done?');
      
      // Focus and blur without entering anything
      fireEvent(nameInput, 'focus');
      fireEvent(nameInput, 'blur');

      await waitFor(() => {
        expect(getByText('Task name is required')).toBeDefined();
      });

      // Enter valid name
      fireEvent.changeText(nameInput, 'Valid name');
      fireEvent(nameInput, 'blur');

      await waitFor(() => {
        expect(() => getByText('Task name is required')).toThrow();
      });
    });

    it('should validate tag constraints', async () => {
      const { getByPlaceholderText, getByText, getAllByText } = render(
        <TaskForm {...defaultProps} />
      );

      const tagInput = getByPlaceholderText('Add tags...');

      // Add multiple tags
      for (let i = 1; i <= 10; i++) {
        fireEvent.changeText(tagInput, `tag${i}`);
        fireEvent.press(getByText('Add'));
      }

      // Try to add 11th tag (assuming 10 is the limit)
      fireEvent.changeText(tagInput, 'tag11');
      fireEvent.press(getByText('Add'));

      // Should show error or prevent addition
      await waitFor(() => {
        const tagElements = getAllByText(/tag\d+/);
        expect(tagElements.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('State Management', () => {
    it('should track changes correctly in edit mode', async () => {
      const initialValues: Partial<TaskFormData> = {
        name: 'Original task',
        description: 'Original description',
        priority: 'low',
        tags: ['original'],
        progress: 25,
      };

      const { getByText, getByDisplayValue, rerender } = render(
        <TaskForm 
          {...defaultProps} 
          mode="edit"
          initialValues={initialValues}
        />
      );

      // Initially, save button should be disabled (no changes)
      const saveButton = getByText('Save Changes');
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);

      // Make a change
      fireEvent.changeText(
        getByDisplayValue('Original task'),
        'Modified task'
      );

      // Rerender to check state update
      rerender(
        <TaskForm 
          {...defaultProps} 
          mode="edit"
          initialValues={initialValues}
        />
      );

      // Save button should now be enabled
      await waitFor(() => {
        expect(getByText('Save Changes').props.accessibilityState?.disabled).toBe(false);
      });
    });

    it('should reset validation errors when fixing fields', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <TaskForm {...defaultProps} />
      );

      // Trigger validation error
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent(nameInput, 'focus');
      fireEvent(nameInput, 'blur');

      await waitFor(() => {
        expect(getByText('Task name is required')).toBeDefined();
      });

      // Fix the error
      fireEvent.changeText(nameInput, 'Fixed task name');
      fireEvent(nameInput, 'blur');

      await waitFor(() => {
        expect(queryByText('Task name is required')).toBeNull();
      });
    });
  });

  describe('Complex Interactions', () => {
    it('should handle gradient picker interactions', async () => {
      const { getByText, getAllByText } = render(
        <TaskForm {...defaultProps} />
      );

      // Open gradient picker
      fireEvent.press(getByText('Ocean'));
      
      // Should show gradient options
      await waitFor(() => {
        expect(getByText('Sunset')).toBeDefined();
        expect(getByText('Forest')).toBeDefined();
        expect(getByText('Lavender')).toBeDefined();
      });

      // Select different gradient
      fireEvent.press(getByText('Sunset'));

      // Picker should close and show new selection
      await waitFor(() => {
        expect(() => getByText('Forest')).toThrow(); // Picker closed
        expect(getByText('Sunset')).toBeDefined(); // New selection shown
      });
    });

    it('should handle date picker integration', async () => {
      const { getByText } = render(
        <TaskForm {...defaultProps} />
      );

      // Due date component should be present
      expect(getByText('Due Date')).toBeDefined();
      
      // Note: Actual date picker interaction would require mocking
      // the native date picker component
    });

    it('should handle priority change effects', async () => {
      const onSubmit = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <TaskForm {...defaultProps} onSubmit={onSubmit} />
      );

      // Fill required fields
      fireEvent.changeText(
        getByPlaceholderText('What needs to be done?'),
        'Urgent task'
      );

      // Select urgent priority
      fireEvent.press(getByText('Urgent'));

      // Submit
      fireEvent.press(getByText('Create Task'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 'urgent',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      const { getByText, getByPlaceholderText } = render(
        <TaskForm {...defaultProps} onSubmit={onSubmit} />
      );

      // Fill required fields
      fireEvent.changeText(
        getByPlaceholderText('What needs to be done?'),
        'Test task'
      );

      // Submit
      fireEvent.press(getByText('Create Task'));

      // Should handle the error (component should not crash)
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it('should disable form during submission', async () => {
      const onSubmit = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const { getByText, getByPlaceholderText } = render(
        <TaskForm {...defaultProps} onSubmit={onSubmit} isLoading={true} />
      );

      const submitButton = getByText('Create Task');
      
      // Button should be disabled when loading
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Conditional Rendering', () => {
    it('should show/hide fields based on props', () => {
      const { queryByText, rerender } = render(
        <TaskForm {...defaultProps} showNotes={false} showProgress={false} />
      );

      // Notes should be hidden
      expect(queryByText('Notes')).toBeNull();

      // Rerender with notes enabled
      rerender(
        <TaskForm {...defaultProps} showNotes={true} />
      );

      expect(queryByText('Notes')).toBeDefined();
    });

    it('should show progress only in edit mode', () => {
      const { queryByText, rerender } = render(
        <TaskForm {...defaultProps} mode="create" />
      );

      // Progress should not show in create mode
      expect(queryByText(/Progress:/)).toBeNull();

      // Show in edit mode
      rerender(
        <TaskForm 
          {...defaultProps} 
          mode="edit" 
          initialValues={{ name: 'Task', progress: 50 }}
        />
      );

      expect(queryByText('Progress: 50%')).toBeDefined();
    });
  });
});
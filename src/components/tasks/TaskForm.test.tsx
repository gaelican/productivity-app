import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TaskForm, TaskFormProps, TaskFormData } from './TaskForm';
import { validateTaskForm, validateField } from './TaskFormValidation';

// Mock dependencies
jest.mock('./TaskFormValidation');
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('../../core/tasks/gradients', () => ({
  GradientThemeManager: {
    getGradientById: (id: string) => ({
      id,
      name: `${id} theme`,
      colors: ['#000', '#fff'],
    }),
    getAllGradients: () => [
      { id: 'ocean', name: 'Ocean', colors: ['#00a', '#00f'] },
      { id: 'sunset', name: 'Sunset', colors: ['#f00', '#ff0'] },
    ],
  },
}));

// Mock child components
jest.mock('./DateTimePicker', () => ({
  DateTimePickerComponent: ({ value, onChange, label }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <>
        <Text>{label}</Text>
        <TouchableOpacity
          testID="date-picker"
          onPress={() => onChange(new Date('2024-12-31T12:00:00'))}
        >
          <Text>{value ? value.toISOString() : 'Select date'}</Text>
        </TouchableOpacity>
      </>
    );
  },
}));

jest.mock('./PrioritySelector', () => ({
  PrioritySelector: ({ value, onChange }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="priority-selector" onPress={() => onChange('high')}>
        <Text>Priority: {value}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('./TagInput', () => ({
  TagInput: ({ value, onChange }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="tag-input" onPress={() => onChange(['work', 'important'])}>
        <Text>Tags: {value.join(', ')}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('./GoalSelector', () => ({
  GoalSelector: ({ value, onChange }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="goal-selector" onPress={() => onChange('goal-123')}>
        <Text>Goal: {value || 'none'}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('./IconPicker', () => ({
  IconPicker: ({ value, onChange }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="icon-picker" onPress={() => onChange('✅')}>
        <Text>Icon: {value}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('TaskForm', () => {
  const defaultProps: TaskFormProps = {
    mode: 'create',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (validateTaskForm as jest.Mock).mockResolvedValue({});
    (validateField as jest.Mock).mockResolvedValue(null);
  });

  describe('Rendering', () => {
    it('should render all form fields in create mode', () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <TaskForm {...defaultProps} />
      );

      // Core fields
      expect(getByPlaceholderText('What needs to be done?')).toBeTruthy();
      expect(getByPlaceholderText('Add more details...')).toBeTruthy();
      expect(getByPlaceholderText('Private notes...')).toBeTruthy();

      // Labels
      expect(getByText('Task Name *')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
      expect(getByText('Notes')).toBeTruthy();
      expect(getByText('Color Theme')).toBeTruthy();

      // Child components
      expect(getByTestId('icon-picker')).toBeTruthy();
      expect(getByTestId('priority-selector')).toBeTruthy();
      expect(getByTestId('date-picker')).toBeTruthy();
      expect(getByTestId('tag-input')).toBeTruthy();
      expect(getByTestId('goal-selector')).toBeTruthy();

      // Buttons
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Create Task')).toBeTruthy();
    });

    it('should render progress slider in edit mode', () => {
      const { getByText } = render(
        <TaskForm {...defaultProps} mode="edit" />
      );

      expect(getByText('Progress: 0%')).toBeTruthy();
      expect(getByText('Save Changes')).toBeTruthy();
    });

    it('should populate fields with initial values', () => {
      const initialValues: Partial<TaskFormData> = {
        name: 'Test Task',
        description: 'Test Description',
        notes: 'Test Notes',
        icon: '🎯',
        priority: 'high',
        tags: ['test', 'demo'],
        progress: 75,
      };

      const { getByDisplayValue, getByText } = render(
        <TaskForm {...defaultProps} initialValues={initialValues} mode="edit" />
      );

      expect(getByDisplayValue('Test Task')).toBeTruthy();
      expect(getByDisplayValue('Test Description')).toBeTruthy();
      expect(getByDisplayValue('Test Notes')).toBeTruthy();
      expect(getByText('Icon: 🎯')).toBeTruthy();
      expect(getByText('Priority: high')).toBeTruthy();
      expect(getByText('Tags: test, demo')).toBeTruthy();
      expect(getByText('Progress: 75%')).toBeTruthy();
    });
  });

  describe('Field Interactions', () => {
    it('should update task name field', () => {
      const { getByPlaceholderText } = render(<TaskForm {...defaultProps} />);
      const nameInput = getByPlaceholderText('What needs to be done?');

      fireEvent.changeText(nameInput, 'New Task Name');
      expect(nameInput.props.value).toBe('New Task Name');
    });

    it('should update icon when icon picker is used', () => {
      const { getByTestId, getByText } = render(<TaskForm {...defaultProps} />);
      
      expect(getByText('Icon: 📝')).toBeTruthy(); // Default icon
      fireEvent.press(getByTestId('icon-picker'));
      expect(getByText('Icon: ✅')).toBeTruthy(); // Updated icon
    });

    it('should update priority when priority selector is used', () => {
      const { getByTestId, getByText } = render(<TaskForm {...defaultProps} />);
      
      expect(getByText('Priority: medium')).toBeTruthy(); // Default priority
      fireEvent.press(getByTestId('priority-selector'));
      expect(getByText('Priority: high')).toBeTruthy(); // Updated priority
    });

    it('should update tags when tag input is used', () => {
      const { getByTestId, getByText } = render(<TaskForm {...defaultProps} />);
      
      expect(getByText('Tags: ')).toBeTruthy(); // No tags initially
      fireEvent.press(getByTestId('tag-input'));
      expect(getByText('Tags: work, important')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate fields on blur', async () => {
      const { getByPlaceholderText } = render(<TaskForm {...defaultProps} />);
      const nameInput = getByPlaceholderText('What needs to be done?');

      await waitFor(() => {
        fireEvent(nameInput, 'blur');
      });

      expect(validateField).toHaveBeenCalledWith('name', '', 'create');
    });

    it('should show validation errors', async () => {
      (validateField as jest.Mock).mockResolvedValue('Task name is required');
      
      const { getByPlaceholderText, getByText } = render(<TaskForm {...defaultProps} />);
      const nameInput = getByPlaceholderText('What needs to be done?');

      await waitFor(() => {
        fireEvent(nameInput, 'blur');
      });

      await waitFor(() => {
        expect(getByText('Task name is required')).toBeTruthy();
      });
    });

    it('should validate all fields on submit', async () => {
      (validateTaskForm as jest.Mock).mockResolvedValue({
        name: 'Task name is required',
        tags: 'At least one tag is required',
      });

      const { getByText } = render(<TaskForm {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.press(getByText('Create Task'));
      });

      await waitFor(() => {
        expect(validateTaskForm).toHaveBeenCalled();
        expect(getByText('Task name is required')).toBeTruthy();
        expect(getByText('At least one tag is required')).toBeTruthy();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with all data in create mode', async () => {
      const onSubmit = jest.fn();
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TaskForm {...defaultProps} onSubmit={onSubmit} />
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('What needs to be done?'), 'Test Task');
      fireEvent.changeText(getByPlaceholderText('Add more details...'), 'Test Description');
      fireEvent.press(getByTestId('icon-picker'));
      fireEvent.press(getByTestId('priority-selector'));
      fireEvent.press(getByTestId('tag-input'));

      // Submit
      await waitFor(() => {
        fireEvent.press(getByText('Create Task'));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Test Task',
          description: 'Test Description',
          notes: undefined,
          icon: '✅',
          color: 'ocean',
          priority: 'high',
          dueDate: undefined,
          dueTime: undefined,
          tags: ['work', 'important'],
          goalId: undefined,
          progress: 0,
        });
      });
    });

    it('should call onCancel when cancel button is pressed', () => {
      const onCancel = jest.fn();
      const { getByText } = render(
        <TaskForm {...defaultProps} onCancel={onCancel} />
      );

      fireEvent.press(getByText('Cancel'));
      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable submit button when name is empty', () => {
      const { getByText } = render(<TaskForm {...defaultProps} />);
      const submitButton = getByText('Create Task');
      
      // Parent TouchableOpacity should be disabled
      expect(submitButton.parent.parent.props.disabled).toBe(true);
    });

    it('should enable submit button when name is provided', () => {
      const { getByText, getByPlaceholderText } = render(
        <TaskForm {...defaultProps} />
      );

      fireEvent.changeText(getByPlaceholderText('What needs to be done?'), 'Task Name');
      
      const submitButton = getByText('Create Task');
      expect(submitButton.parent.parent.props.disabled).toBe(false);
    });
  });

  describe('Edit Mode Specific', () => {
    it('should disable submit button when no changes in edit mode', () => {
      const initialValues: Partial<TaskFormData> = {
        name: 'Test Task',
      };

      const { getByText } = render(
        <TaskForm {...defaultProps} mode="edit" initialValues={initialValues} />
      );

      const submitButton = getByText('Save Changes');
      expect(submitButton.parent.parent.props.disabled).toBe(true);
    });

    it('should enable submit button when changes made in edit mode', () => {
      const initialValues: Partial<TaskFormData> = {
        name: 'Test Task',
      };

      const { getByText, getByPlaceholderText } = render(
        <TaskForm {...defaultProps} mode="edit" initialValues={initialValues} />
      );

      fireEvent.changeText(getByPlaceholderText('What needs to be done?'), 'Updated Task');

      const submitButton = getByText('Save Changes');
      expect(submitButton.parent.parent.props.disabled).toBe(false);
    });

    it('should update progress in edit mode', () => {
      const { getByText } = render(
        <TaskForm {...defaultProps} mode="edit" />
      );

      expect(getByText('Progress: 0%')).toBeTruthy();
      fireEvent.press(getByText('75%'));
      expect(getByText('Progress: 75%')).toBeTruthy();
    });
  });
});
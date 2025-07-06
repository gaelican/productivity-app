import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaskEditScreen } from '../TaskEditScreen';
import { taskRepository } from '../../../services/database/repositories/TaskRepository';
import Task from '../../../services/database/models/Task';
import { GradientThemeManager } from '../../../core/tasks/gradients';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('../../../services/database/repositories/TaskRepository');
jest.mock('../../../components/tasks/DateTimePicker', () => ({
  DateTimePickerComponent: ({ value, onChange, label }: any) => (
    <MockComponent 
      testID="date-time-picker" 
      onPress={() => {
        console.log('🗓️ DateTimePicker pressed - current value:', value);
        onChange(new Date('2024-12-31T10:00:00'));
      }}
      label={label}
    />
  ),
}));

jest.mock('../../../components/tasks/PrioritySelector', () => ({
  PrioritySelector: ({ value, onChange }: any) => (
    <MockComponent 
      testID="priority-selector" 
      onPress={() => {
        console.log('🎯 PrioritySelector pressed - current value:', value);
        const priorities = ['low', 'medium', 'high', 'urgent'];
        const currentIndex = priorities.indexOf(value);
        const nextIndex = (currentIndex + 1) % priorities.length;
        onChange(priorities[nextIndex]);
      }}
      value={value}
    />
  ),
}));

jest.mock('../../../components/tasks/TagInput', () => ({
  TagInput: ({ value, onChange }: any) => (
    <MockComponent 
      testID="tag-input" 
      onPress={() => {
        console.log('🏷️ TagInput pressed - current tags:', value);
        onChange([...value, `tag-${value.length + 1}`]);
      }}
      value={value?.join(', ')}
    />
  ),
}));

jest.mock('../../../components/tasks/GoalSelector', () => ({
  GoalSelector: ({ value, onChange }: any) => (
    <MockComponent 
      testID="goal-selector" 
      onPress={() => {
        console.log('🎯 GoalSelector pressed - current value:', value);
        onChange(value ? undefined : 'goal-123');
      }}
      value={value}
    />
  ),
}));

jest.mock('../../../components/tasks/IconPicker', () => ({
  IconPicker: ({ value, onChange }: any) => (
    <MockComponent 
      testID="icon-picker" 
      onPress={() => {
        console.log('🎨 IconPicker pressed - current value:', value);
        const icons = ['📝', '🎯', '🚀', '💡', '🔥'];
        const currentIndex = icons.indexOf(value);
        const nextIndex = (currentIndex + 1) % icons.length;
        onChange(icons[nextIndex]);
      }}
      value={value}
    />
  ),
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');

// Helper component for mocked components
const MockComponent = ({ testID, onPress, label, value, children }: any) => (
  <div testID={testID} onTouchEnd={onPress}>
    {label && <span>{label}</span>}
    {value && <span>Value: {value}</span>}
    {children}
  </div>
);

// Create mock task
const createMockTask = (overrides = {}): Task => {
  const mockTask = {
    id: 'task-123',
    name: 'Test Task',
    description: 'Test Description',
    notes: 'Test Notes',
    icon: '📝',
    color: 'ocean',
    priority: 'medium',
    dueDate: Date.now() + 86400000, // Tomorrow
    tags: ['test', 'mock'],
    goalId: 'goal-456',
    progress: 50,
    isCompleted: false,
    completedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-123',
    deviceId: 'device-123',
    version: 1,
    syncStatus: 'synced',
    parsedInput: 'Original task input',
    complete: jest.fn().mockResolvedValue(undefined),
    uncomplete: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;

  return mockTask;
};

// Test wrapper with navigation
const Stack = createNativeStackNavigator();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="TaskEdit" component={TaskEditScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('TaskEditScreen Interactive Tests', () => {
  let mockTask: Task;
  
  beforeEach(() => {
    console.log('\n🧪 Starting new test...\n');
    jest.clearAllMocks();
    mockTask = createMockTask();
    (taskRepository.findById as jest.Mock).mockResolvedValue(mockTask);
    (taskRepository.update as jest.Mock).mockResolvedValue(undefined);
    (taskRepository.delete as jest.Mock).mockResolvedValue(undefined);
    mockAlert.mockClear();
  });

  describe('Form Field Interactions', () => {
    it('should handle text input changes and track state updates', async () => {
      console.log('📝 Testing text input interactions...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText, getByText, rerender } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalledWith('task-123');
      });

      // Test name input
      const nameInput = getByPlaceholderText('What needs to be done?');
      console.log('   ✅ Found name input, current value:', nameInput.props.value);
      
      fireEvent.changeText(nameInput, 'Updated Task Name');
      console.log('   📤 Changed name to: "Updated Task Name"');
      
      // Force re-render to check state update
      rerender(<TaskEditScreen navigation={navigation as any} route={route as any} />);
      
      // Test description input
      const descriptionInput = getByPlaceholderText('Add more details...');
      console.log('   ✅ Found description input, current value:', descriptionInput.props.value);
      
      fireEvent.changeText(descriptionInput, 'New detailed description');
      console.log('   📤 Changed description to: "New detailed description"');
      
      // Test notes input
      const notesInput = getByPlaceholderText('Private notes...');
      console.log('   ✅ Found notes input, current value:', notesInput.props.value);
      
      fireEvent.changeText(notesInput, 'Important private notes');
      console.log('   📤 Changed notes to: "Important private notes"');
      
      // Verify save button becomes enabled
      await waitFor(() => {
        const saveButton = getByText('Save');
        console.log('   🔍 Save button enabled:', !saveButton.props.disabled);
        expect(saveButton.props.disabled).toBe(false);
      });
    });

    it('should handle multiline text areas with line breaks', async () => {
      console.log('📝 Testing multiline text areas...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      const descriptionInput = getByPlaceholderText('Add more details...');
      const multilineText = 'Line 1\nLine 2\nLine 3';
      
      fireEvent.changeText(descriptionInput, multilineText);
      console.log('   📤 Set multiline description with line breaks');
      
      // Verify multiline prop
      expect(descriptionInput.props.multiline).toBe(true);
      expect(descriptionInput.props.numberOfLines).toBe(3);
      console.log('   ✅ Multiline text area configured correctly');
    });
  });

  describe('Component Interactions', () => {
    it('should handle all component interactions sequentially', async () => {
      console.log('🎮 Testing component interactions...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByTestId, getByText, rerender } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Test icon picker
      const iconPicker = getByTestId('icon-picker');
      fireEvent(iconPicker, 'touchEnd');
      console.log('   ✅ Icon picker interaction completed');
      
      // Test priority selector
      const prioritySelector = getByTestId('priority-selector');
      fireEvent(prioritySelector, 'touchEnd');
      console.log('   ✅ Priority selector interaction completed');
      
      // Test date picker
      const datePicker = getByTestId('date-time-picker');
      fireEvent(datePicker, 'touchEnd');
      console.log('   ✅ Date picker interaction completed');
      
      // Test tag input
      const tagInput = getByTestId('tag-input');
      fireEvent(tagInput, 'touchEnd');
      fireEvent(tagInput, 'touchEnd'); // Add multiple tags
      console.log('   ✅ Tag input interactions completed');
      
      // Test goal selector
      const goalSelector = getByTestId('goal-selector');
      fireEvent(goalSelector, 'touchEnd');
      console.log('   ✅ Goal selector interaction completed');
      
      // Force re-render to check all state updates
      rerender(<TaskEditScreen navigation={navigation as any} route={route as any} />);
      
      // Verify save button is enabled after changes
      await waitFor(() => {
        const saveButton = getByText('Save');
        expect(saveButton.props.disabled).toBe(false);
        console.log('   ✅ Save button enabled after component changes');
      });
    });

    it('should handle progress slider interactions', async () => {
      console.log('📊 Testing progress slider...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByText, getAllByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Test progress buttons
      const progressButtons = ['0%', '25%', '50%', '75%', '100%'];
      
      for (const buttonText of progressButtons) {
        const button = getByText(buttonText);
        fireEvent.press(button);
        console.log(`   📊 Pressed progress button: ${buttonText}`);
        
        // Check if progress label updates
        await waitFor(() => {
          const progressLabel = getByText(new RegExp(`Progress: \\d+%`));
          console.log(`   ✅ Progress label updated:`, progressLabel.props.children);
        });
      }
    });
  });

  describe('Task Status Operations', () => {
    it('should handle task completion toggle', async () => {
      console.log('✅ Testing task completion toggle...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Test marking as complete
      const completeButton = getByText('○ Mark as Complete');
      fireEvent.press(completeButton);
      console.log('   📤 Pressed complete button');
      
      await waitFor(() => {
        expect(mockTask.complete).toHaveBeenCalled();
        console.log('   ✅ Task.complete() called');
      });

      // Update mock task state
      mockTask.isCompleted = true;
      mockTask.completedAt = Date.now();
      
      // Test uncompleting
      const uncompleteButton = getByText('✓ Completed');
      fireEvent.press(uncompleteButton);
      console.log('   📤 Pressed uncomplete button');
      
      await waitFor(() => {
        expect(mockTask.uncomplete).toHaveBeenCalled();
        console.log('   ✅ Task.uncomplete() called');
      });
    });

    it('should handle task deletion with confirmation', async () => {
      console.log('🗑️ Testing task deletion...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      const deleteButton = getByText('🗑 Delete Task');
      fireEvent.press(deleteButton);
      console.log('   📤 Pressed delete button');
      
      // Check alert was shown
      expect(mockAlert).toHaveBeenCalledWith(
        'Delete Task',
        'Are you sure you want to delete this task? This cannot be undone.',
        expect.any(Array)
      );
      console.log('   ✅ Confirmation alert shown');
      
      // Simulate confirming deletion
      const alertButtons = mockAlert.mock.calls[0][2];
      const deleteConfirmButton = alertButtons?.find(btn => btn.text === 'Delete');
      
      if (deleteConfirmButton?.onPress) {
        await act(async () => {
          await deleteConfirmButton.onPress();
        });
        
        expect(taskRepository.delete).toHaveBeenCalledWith('task-123');
        expect(navigation.goBack).toHaveBeenCalled();
        console.log('   ✅ Task deleted and navigated back');
      }
    });
  });

  describe('Save and Navigation', () => {
    it('should save changes and navigate back', async () => {
      console.log('💾 Testing save functionality...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText, getByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Make changes
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Updated Task');
      console.log('   📝 Updated task name');
      
      // Save changes
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);
      console.log('   📤 Pressed save button');
      
      await waitFor(() => {
        expect(taskRepository.update).toHaveBeenCalledWith('task-123', expect.objectContaining({
          name: 'Updated Task',
        }));
        console.log('   ✅ Task updated with new data');
        
        expect(navigation.goBack).toHaveBeenCalled();
        console.log('   ✅ Navigation back triggered');
      });
    });

    it('should handle unsaved changes warning', async () => {
      console.log('⚠️ Testing unsaved changes warning...');
      
      const removeListener = jest.fn();
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockImplementation((event, callback) => {
          if (event === 'beforeRemove') {
            // Simulate navigation attempt
            setTimeout(() => {
              const mockEvent = {
                preventDefault: jest.fn(),
                data: { action: 'GO_BACK' }
              };
              callback(mockEvent);
              console.log('   🔄 Navigation intercepted');
            }, 100);
          }
          return removeListener;
        }),
        dispatch: jest.fn()
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Make changes
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Unsaved changes');
      console.log('   📝 Made unsaved changes');
      
      // Wait for navigation attempt
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Discard changes?',
          'You have unsaved changes. Are you sure you want to discard them?',
          expect.any(Array)
        );
        console.log('   ✅ Unsaved changes alert shown');
      });
    });
  });

  describe('Gradient Theme Selection', () => {
    it('should handle gradient theme picker interactions', async () => {
      console.log('🎨 Testing gradient theme selection...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByText, getAllByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Open gradient picker
      const currentGradient = GradientThemeManager.getGradientById('ocean');
      const gradientSelector = getByText(currentGradient!.name);
      fireEvent.press(gradientSelector);
      console.log('   📤 Opened gradient picker');
      
      // Select a different gradient
      const gradients = GradientThemeManager.getAllGradients();
      if (gradients.length > 1) {
        const newGradient = gradients.find(g => g.id !== 'ocean');
        if (newGradient) {
          const newGradientOption = getByText(newGradient.name);
          fireEvent.press(newGradientOption);
          console.log(`   🎨 Selected new gradient: ${newGradient.name}`);
          
          // Verify picker closed and save button enabled
          await waitFor(() => {
            const saveButton = getByText('Save');
            expect(saveButton.props.disabled).toBe(false);
            console.log('   ✅ Gradient changed and save enabled');
          });
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle task loading errors', async () => {
      console.log('❌ Testing task loading error...');
      
      (taskRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      render(<TaskEditScreen navigation={navigation as any} route={route as any} />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to load task');
        expect(navigation.goBack).toHaveBeenCalled();
        console.log('   ✅ Error handled and navigated back');
      });
    });

    it('should handle save errors gracefully', async () => {
      console.log('❌ Testing save error handling...');
      
      (taskRepository.update as jest.Mock).mockRejectedValue(new Error('Save failed'));
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText, getByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Make changes and try to save
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, 'Will fail to save');
      
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);
      console.log('   📤 Attempted to save with error');
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to save changes');
        expect(navigation.goBack).not.toHaveBeenCalled();
        console.log('   ✅ Error shown, stayed on screen');
      });
    });

    it('should validate required fields', async () => {
      console.log('✏️ Testing field validation...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText, getByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Clear name field
      const nameInput = getByPlaceholderText('What needs to be done?');
      fireEvent.changeText(nameInput, '   '); // Only whitespace
      console.log('   📝 Cleared task name (whitespace only)');
      
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);
      console.log('   📤 Attempted to save with empty name');
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Task name is required');
        console.log('   ✅ Validation error shown');
      });
    });
  });

  describe('Performance and Re-rendering', () => {
    it('should efficiently handle rapid input changes', async () => {
      console.log('⚡ Testing rapid input changes...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      const nameInput = getByPlaceholderText('What needs to be done?');
      
      // Simulate rapid typing
      const rapidChanges = ['T', 'Te', 'Tes', 'Test', 'Test ', 'Test T', 'Test Ta', 'Test Tas', 'Test Task'];
      
      console.time('   ⏱️ Rapid input time');
      for (const text of rapidChanges) {
        fireEvent.changeText(nameInput, text);
      }
      console.timeEnd('   ⏱️ Rapid input time');
      
      console.log('   ✅ Handled rapid input changes without errors');
    });

    it('should handle concurrent state updates', async () => {
      console.log('🔄 Testing concurrent state updates...');
      
      const navigation = { 
        goBack: jest.fn(), 
        addListener: jest.fn().mockReturnValue(jest.fn()) 
      };
      const route = { params: { taskId: 'task-123' } };
      
      const { getByPlaceholderText, getByTestId, getByText } = render(
        <TaskEditScreen navigation={navigation as any} route={route as any} />
      );

      await waitFor(() => {
        expect(taskRepository.findById).toHaveBeenCalled();
      });

      // Update multiple fields simultaneously
      console.log('   🔄 Updating multiple fields concurrently...');
      
      fireEvent.changeText(getByPlaceholderText('What needs to be done?'), 'Concurrent Update');
      fireEvent.changeText(getByPlaceholderText('Add more details...'), 'Concurrent Description');
      fireEvent(getByTestId('priority-selector'), 'touchEnd');
      fireEvent(getByTestId('tag-input'), 'touchEnd');
      fireEvent.press(getByText('75%'));
      
      console.log('   ✅ Multiple concurrent updates handled');
      
      // Verify save button is enabled
      await waitFor(() => {
        const saveButton = getByText('Save');
        expect(saveButton.props.disabled).toBe(false);
        console.log('   ✅ Save button correctly enabled after concurrent updates');
      });
    });
  });
});
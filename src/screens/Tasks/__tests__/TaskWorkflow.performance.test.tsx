import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { performance } from 'perf_hooks';
import { TaskForm } from '../../../components/tasks/TaskForm';
import { TaskCreateScreen } from '../TaskCreateScreen';
import { TaskEditScreen } from '../TaskEditScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { taskRepository } from '../../../services/database/repositories/TaskRepository';
import Task from '../../../services/database/models/Task';

// Mock dependencies
jest.mock('../../../services/database/repositories/TaskRepository');
jest.mock('../../../services/database/repositories/GoalRepository', () => ({
  goalRepository: {
    getActiveGoals: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  formRender: 100,
  inputResponse: 16, // 60fps
  validation: 50,
  submission: 1000,
  screenTransition: 300,
  dataLoad: 500,
};

// Helper to measure render time
const measureRenderTime = async (component: React.ReactElement) => {
  const start = performance.now();
  const result = render(component);
  await waitFor(() => {}, { timeout: 0 }); // Force immediate measurement
  const end = performance.now();
  return { renderTime: end - start, result };
};

// Helper to measure function execution time
const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { executionTime: end - start, result };
};

describe('Task Workflow Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TaskForm Component Performance', () => {
    it('should render within performance threshold', async () => {
      const { renderTime } = await measureRenderTime(
        <TaskForm 
          mode="create"
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.formRender);
      console.log(`TaskForm render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle text input without lag', async () => {
      const { result } = await measureRenderTime(
        <TaskForm 
          mode="create"
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = result.getByPlaceholderText('What needs to be done?');
      
      // Measure rapid text input
      const inputTimes: number[] = [];
      const testString = 'This is a test of rapid text input performance';
      
      for (const char of testString) {
        const { executionTime } = await measureExecutionTime(async () => {
          fireEvent.changeText(nameInput, testString.substring(0, testString.indexOf(char) + 1));
        });
        inputTimes.push(executionTime);
      }

      const avgInputTime = inputTimes.reduce((a, b) => a + b, 0) / inputTimes.length;
      expect(avgInputTime).toBeLessThan(PERFORMANCE_THRESHOLDS.inputResponse);
      console.log(`Average input response time: ${avgInputTime.toFixed(2)}ms`);
    });

    it('should validate fields quickly', async () => {
      const { result } = await measureRenderTime(
        <TaskForm 
          mode="create"
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = result.getByPlaceholderText('What needs to be done?');
      
      // Measure validation time
      const { executionTime } = await measureExecutionTime(async () => {
        fireEvent(nameInput, 'focus');
        fireEvent(nameInput, 'blur');
        await waitFor(() => {
          expect(result.getByText('Task name is required')).toBeDefined();
        });
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.validation);
      console.log(`Field validation time: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle form submission efficiently', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = await measureRenderTime(
        <TaskForm 
          mode="create"
          onSubmit={onSubmit}
          onCancel={jest.fn()}
        />
      );

      // Fill required fields
      fireEvent.changeText(
        result.getByPlaceholderText('What needs to be done?'),
        'Performance test task'
      );

      // Measure submission time
      const { executionTime } = await measureExecutionTime(async () => {
        fireEvent.press(result.getByText('Create Task'));
        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.submission);
      console.log(`Form submission time: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('TaskCreateScreen Performance', () => {
    const Stack = createNativeStackNavigator();
    const TestNavigator = ({ children }: any) => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="TaskCreate" component={TaskCreateScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    it('should render create screen quickly', async () => {
      const { renderTime } = await measureRenderTime(
        <TestNavigator />
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.screenTransition);
      console.log(`TaskCreateScreen render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle natural language parsing efficiently', async () => {
      const { result } = render(<TestNavigator />);

      const naturalInput = result.getByPlaceholderText('e.g., Call mom tomorrow at 3pm high priority #family');
      
      // Measure parsing time for complex input
      const { executionTime } = await measureExecutionTime(async () => {
        fireEvent.changeText(
          naturalInput,
          'Complete project documentation by Friday 5pm high priority #work #urgent @ProjectAlpha with detailed analysis'
        );
        
        // Wait for preview to update
        await waitFor(() => {
          expect(result.getByText('Complete project documentation')).toBeDefined();
        });
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.validation * 2);
      console.log(`Natural language parsing time: ${executionTime.toFixed(2)}ms`);
    });

    it('should switch between modes without performance degradation', async () => {
      const { result } = render(<TestNavigator />);

      const modeSwitchTimes: number[] = [];
      
      // Measure multiple mode switches
      for (let i = 0; i < 5; i++) {
        const { executionTime } = await measureExecutionTime(async () => {
          fireEvent.press(result.getByText('📝 Form'));
          await waitFor(() => {
            expect(result.getByPlaceholderText('What needs to be done?')).toBeDefined();
          });
          
          fireEvent.press(result.getByText('✨ Natural Language'));
          await waitFor(() => {
            expect(result.getByPlaceholderText('e.g., Call mom tomorrow at 3pm high priority #family')).toBeDefined();
          });
        });
        modeSwitchTimes.push(executionTime);
      }

      const avgSwitchTime = modeSwitchTimes.reduce((a, b) => a + b, 0) / modeSwitchTimes.length;
      expect(avgSwitchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.screenTransition);
      console.log(`Average mode switch time: ${avgSwitchTime.toFixed(2)}ms`);
    });
  });

  describe('TaskEditScreen Performance', () => {
    const mockTask = {
      id: 'task123',
      name: 'Performance test task',
      description: 'A'.repeat(500), // Long description
      notes: 'B'.repeat(300),
      icon: '📝',
      color: 'ocean',
      priority: 'high',
      progress: 50,
      tags: Array.from({ length: 10 }, (_, i) => `tag${i}`),
      isCompleted: false,
      createdAt: Date.now(),
      dueDate: Date.now() + 86400000,
      goalId: 'goal1',
    } as unknown as Task;

    it('should load task data efficiently', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockTask);

      const Stack = createNativeStackNavigator();
      const TestNavigator = () => (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="TaskEdit" 
              component={TaskEditScreen}
              initialParams={{ taskId: 'task123' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );

      const { executionTime } = await measureExecutionTime(async () => {
        const { getByDisplayValue } = render(<TestNavigator />);
        await waitFor(() => {
          expect(getByDisplayValue('Performance test task')).toBeDefined();
        });
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.dataLoad);
      console.log(`Task data load time: ${executionTime.toFixed(2)}ms`);
    });

    it('should update large tasks efficiently', async () => {
      (taskRepository.findById as jest.Mock).mockResolvedValue(mockTask);
      (taskRepository.update as jest.Mock).mockResolvedValue(true);

      const Stack = createNativeStackNavigator();
      const { getByDisplayValue, getByText } = render(
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="TaskEdit" 
              component={TaskEditScreen}
              initialParams={{ taskId: 'task123' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByDisplayValue('Performance test task')).toBeDefined();
      });

      // Make multiple changes
      const { executionTime } = await measureExecutionTime(async () => {
        fireEvent.changeText(
          getByDisplayValue('Performance test task'),
          'Updated performance test task with a much longer name'
        );
        
        fireEvent.press(getByText('75%'));
        
        fireEvent.press(getByText('Save Changes'));
        
        await waitFor(() => {
          expect(taskRepository.update).toHaveBeenCalled();
        });
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.submission);
      console.log(`Large task update time: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple create/destroy cycles
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TaskForm 
            mode="create"
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
            initialValues={{
              name: `Memory test ${i}`,
              description: 'A'.repeat(1000),
              tags: Array.from({ length: 20 }, (_, j) => `tag${j}`),
            }}
          />
        );
        
        // Simulate some interactions
        const nameInput = screen.getByPlaceholderText('What needs to be done?');
        fireEvent.changeText(nameInput, `Updated memory test ${i}`);
        
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      // Should not increase by more than 10MB
      expect(memoryIncreaseMB).toBeLessThan(10);
      console.log(`Memory increase after 10 cycles: ${memoryIncreaseMB.toFixed(2)}MB`);
    });
  });

  describe('Stress Tests', () => {
    it('should handle rapid form interactions', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TaskForm 
          mode="create"
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const operations = [
        () => fireEvent.changeText(getByPlaceholderText('What needs to be done?'), 'Stress test'),
        () => fireEvent.press(getByText('High')),
        () => fireEvent.press(getByText('Low')),
        () => fireEvent.press(getByText('Urgent')),
        () => fireEvent.changeText(getByPlaceholderText('Add more details...'), 'Details'),
        () => fireEvent.press(getByText('Ocean')),
      ];

      // Perform rapid operations
      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        const operation = operations[i % operations.length];
        operation();
      }
      const end = performance.now();
      
      const totalTime = end - start;
      const avgOperationTime = totalTime / 50;
      
      expect(avgOperationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.inputResponse);
      console.log(`Average operation time under stress: ${avgOperationTime.toFixed(2)}ms`);
    });

    it('should handle large data sets efficiently', async () => {
      const largeTaskData = {
        name: 'Task with large data',
        description: 'A'.repeat(900), // Near max length
        notes: 'B'.repeat(900),
        tags: Array.from({ length: 50 }, (_, i) => `tag${i}`),
      };

      const { renderTime } = await measureRenderTime(
        <TaskForm 
          mode="edit"
          initialValues={largeTaskData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.formRender * 2);
      console.log(`Large data render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  // Performance report generator
  afterAll(() => {
    console.log('\n=== Performance Test Summary ===');
    console.log(`Target Thresholds:`);
    Object.entries(PERFORMANCE_THRESHOLDS).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}ms`);
    });
    console.log('================================\n');
  });
});
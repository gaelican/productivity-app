import { TaskRepository } from '../TaskRepository';
import { getDatabase } from '../../index';
import Task from '../../models/Task';

// Mock database
jest.mock('../../index', () => ({
  getDatabase: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('TaskRepository', () => {
  let taskRepository: TaskRepository;
  let mockDatabase: any;
  let mockTasksCollection: any;
  let mockTask: any;

  beforeEach(() => {
    taskRepository = new TaskRepository();

    // Setup mock task
    mockTask = {
      id: 'task-id',
      name: 'Test Task',
      description: 'Test Description',
      goalId: 'goal-1',
      update: jest.fn(),
      complete: jest.fn(),
      uncomplete: jest.fn(),
      updateProgress: jest.fn(),
      destroyPermanently: jest.fn(),
    };

    // Setup mock collection
    mockTasksCollection = {
      create: jest.fn().mockResolvedValue(mockTask),
      find: jest.fn().mockResolvedValue(mockTask),
      query: jest.fn().mockReturnValue({
        extend: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue([mockTask]),
      }),
    };

    // Setup mock database
    mockDatabase = {
      get: jest.fn().mockReturnValue(mockTasksCollection),
      write: jest.fn((callback) => callback()),
    };

    (getDatabase as jest.Mock).mockResolvedValue(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update task with all fields including goalId', async () => {
      const updateData = {
        name: 'Updated Task',
        description: 'Updated Description',
        notes: 'Updated Notes',
        icon: '🎯',
        color: 'sunset',
        priority: 'high' as const,
        dueDate: Date.now(),
        dueTime: '14:00',
        progress: 75,
        tags: ['updated', 'task'],
        goalId: 'goal-2',
      };

      const result = await taskRepository.update('task-id', updateData);

      expect(mockTasksCollection.find).toHaveBeenCalledWith('task-id');
      expect(mockTask.update).toHaveBeenCalledWith(expect.any(Function));
      
      // Verify the update function sets all fields correctly
      const updateFn = mockTask.update.mock.calls[0][0];
      const mockTaskData: any = {};
      updateFn(mockTaskData);

      expect(mockTaskData.name).toBe('Updated Task');
      expect(mockTaskData.description).toBe('Updated Description');
      expect(mockTaskData.notes).toBe('Updated Notes');
      expect(mockTaskData.icon).toBe('🎯');
      expect(mockTaskData.color).toBe('sunset');
      expect(mockTaskData.priority).toBe('high');
      expect(mockTaskData.dueDate).toBe(updateData.dueDate);
      expect(mockTaskData.dueTime).toBe('14:00');
      expect(mockTaskData.progress).toBe(75);
      expect(mockTaskData.tags).toEqual(['updated', 'task']);
      expect(mockTaskData.goalId).toBe('goal-2');
      expect(mockTaskData.version).toBe(1);
      expect(mockTaskData.syncStatus).toBe('pending');
    });

    it('should handle partial updates correctly', async () => {
      const updateData = {
        name: 'Partially Updated Task',
        goalId: 'new-goal-id',
      };

      await taskRepository.update('task-id', updateData);

      const updateFn = mockTask.update.mock.calls[0][0];
      const mockTaskData: any = {};
      updateFn(mockTaskData);

      expect(mockTaskData.name).toBe('Partially Updated Task');
      expect(mockTaskData.goalId).toBe('new-goal-id');
      expect(mockTaskData.description).toBeUndefined();
      expect(mockTaskData.notes).toBeUndefined();
    });

    it('should handle undefined goalId correctly', async () => {
      const updateData = {
        name: 'Task Without Goal',
        goalId: undefined,
      };

      await taskRepository.update('task-id', updateData);

      const updateFn = mockTask.update.mock.calls[0][0];
      const mockTaskData: any = {};
      updateFn(mockTaskData);

      expect(mockTaskData.goalId).toBeUndefined();
    });

    it('should throw error if task not found', async () => {
      mockTasksCollection.find.mockRejectedValue(new Error('Not found'));

      await expect(taskRepository.update('non-existent', { name: 'Test' }))
        .rejects.toThrow('Task not found');
    });

    it('should update completion status correctly', async () => {
      const updateData = {
        isCompleted: true,
      };

      await taskRepository.update('task-id', updateData);

      const updateFn = mockTask.update.mock.calls[0][0];
      const mockTaskData: any = {};
      updateFn(mockTaskData);

      expect(mockTaskData.isCompleted).toBe(true);
      expect(mockTaskData.completedAt).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create task with goalId', async () => {
      const createData = {
        name: 'New Task',
        userId: 'user-1',
        goalId: 'goal-1',
      };

      await taskRepository.create(createData);

      expect(mockTasksCollection.create).toHaveBeenCalledWith(expect.any(Function));
      
      const createFn = mockTasksCollection.create.mock.calls[0][0];
      const mockTaskData: any = {};
      createFn(mockTaskData);

      expect(mockTaskData.name).toBe('New Task');
      expect(mockTaskData.userId).toBe('user-1');
      expect(mockTaskData.goalId).toBe('goal-1');
    });
  });

  describe('query', () => {
    it('should query tasks by goalId', async () => {
      const filters = {
        userId: 'user-1',
        goalId: 'goal-1',
      };

      const result = await taskRepository.query(filters);

      expect(mockTasksCollection.query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockTask);
    });
  });
});
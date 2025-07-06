import { validateTaskForm, validateField } from '../TaskFormValidation';

describe('TaskForm Validation', () => {
  describe('validateTaskForm', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'Test Task',
        description: 'A test task description',
        notes: 'Some notes',
        icon: '📝',
        color: 'ocean',
        priority: 'medium',
        progress: 50,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        tags: ['work', 'urgent'],
        goalId: 'goal-123',
      };

      const errors = await validateTaskForm(validData, 'create');
      expect(errors).toEqual({});
    });

    it('should fail validation with missing required fields', async () => {
      const invalidData = {
        description: 'Missing required fields',
      };

      const errors = await validateTaskForm(invalidData, 'create');
      expect(errors.name).toBe('Task name is required');
      expect(errors.icon).toBe('Icon is required');
      expect(errors.color).toBe('Color theme is required');
      expect(errors.priority).toBe('Priority is required');
      expect(errors.progress).toBe('Progress is required');
      expect(errors.tags).toBe('At least one tag is required');
    });

    it('should validate task name length', async () => {
      const tooLongName = 'a'.repeat(101);
      const errors = await validateTaskForm({ name: tooLongName }, 'create');
      expect(errors.name).toBe('Task name must be less than 100 characters');
    });

    it('should validate description length', async () => {
      const tooLongDescription = 'a'.repeat(501);
      const errors = await validateTaskForm({ description: tooLongDescription }, 'create');
      expect(errors.description).toBe('Description must be less than 500 characters');
    });

    it('should validate notes length', async () => {
      const tooLongNotes = 'a'.repeat(1001);
      const errors = await validateTaskForm({ notes: tooLongNotes }, 'create');
      expect(errors.notes).toBe('Notes must be less than 1000 characters');
    });

    it('should validate priority values', async () => {
      const errors = await validateTaskForm({ priority: 'invalid' }, 'create');
      expect(errors.priority).toBe('Invalid priority value');
    });

    it('should validate progress range', async () => {
      const errorsNegative = await validateTaskForm({ progress: -1 }, 'create');
      expect(errorsNegative.progress).toBe('Progress must be at least 0%');

      const errorsTooHigh = await validateTaskForm({ progress: 101 }, 'create');
      expect(errorsTooHigh.progress).toBe('Progress cannot exceed 100%');
    });

    it('should validate future due date in create mode', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const errors = await validateTaskForm({ dueDate: pastDate }, 'create');
      expect(errors.dueDate).toBe('Due date must be in the future');
    });

    it('should allow past due date in edit mode', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const validData = {
        name: 'Test Task',
        icon: '📝',
        color: 'ocean',
        priority: 'medium',
        progress: 50,
        tags: ['work'],
        dueDate: pastDate,
      };
      
      const errors = await validateTaskForm(validData, 'edit');
      expect(errors.dueDate).toBeUndefined();
    });

    it('should validate tags array', async () => {
      const emptyTags = await validateTaskForm({ tags: [] }, 'create');
      expect(emptyTags.tags).toBe('At least one tag is required');

      const tooManyTags = await validateTaskForm({ 
        tags: Array(11).fill('tag') 
      }, 'create');
      expect(tooManyTags.tags).toBe('Maximum 10 tags allowed');
    });
  });

  describe('validateField', () => {
    it('should validate individual fields', async () => {
      const nameError = await validateField('name', '', 'create');
      expect(nameError).toBe('Task name is required');

      const validName = await validateField('name', 'Valid Task Name', 'create');
      expect(validName).toBeNull();

      const progressError = await validateField('progress', 150, 'create');
      expect(progressError).toBe('Progress cannot exceed 100%');

      const validProgress = await validateField('progress', 75, 'create');
      expect(validProgress).toBeNull();
    });
  });
});
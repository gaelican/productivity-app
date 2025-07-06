import { createTaskFormSchema, validateTaskForm, validateField } from './TaskFormValidation';
import * as yup from 'yup';

describe('TaskFormValidation', () => {
  describe('createTaskFormSchema', () => {
    describe('name field', () => {
      it('should require name field', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('name', { name: '' })).rejects.toThrow('Task name is required');
        await expect(schema.validateAt('name', { name: null })).rejects.toThrow('Task name is required');
        await expect(schema.validateAt('name', { name: undefined })).rejects.toThrow('Task name is required');
      });

      it('should require minimum 1 character for name', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('name', { name: '' })).rejects.toThrow('Task name is required');
      });

      it('should enforce maximum 100 characters for name', async () => {
        const schema = createTaskFormSchema('create');
        const longName = 'a'.repeat(101);
        await expect(schema.validateAt('name', { name: longName })).rejects.toThrow(
          'Task name must be less than 100 characters'
        );
      });

      it('should trim whitespace from name', async () => {
        const schema = createTaskFormSchema('create');
        const result = await schema.validateAt('name', { name: '  Task Name  ' });
        expect(result).toBe('Task Name');
      });

      it('should accept valid name', async () => {
        const schema = createTaskFormSchema('create');
        const result = await schema.validateAt('name', { name: 'Valid Task Name' });
        expect(result).toBe('Valid Task Name');
      });
    });

    describe('description field', () => {
      it('should be optional', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('description', { description: undefined })).resolves.toBeUndefined();
        await expect(schema.validateAt('description', { description: '' })).resolves.toBe('');
      });

      it('should enforce maximum 500 characters', async () => {
        const schema = createTaskFormSchema('create');
        const longDesc = 'a'.repeat(501);
        await expect(schema.validateAt('description', { description: longDesc })).rejects.toThrow(
          'Description must be less than 500 characters'
        );
      });

      it('should accept valid description', async () => {
        const schema = createTaskFormSchema('create');
        const desc = 'This is a valid description';
        const result = await schema.validateAt('description', { description: desc });
        expect(result).toBe(desc);
      });
    });

    describe('notes field', () => {
      it('should be optional', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('notes', { notes: undefined })).resolves.toBeUndefined();
        await expect(schema.validateAt('notes', { notes: '' })).resolves.toBe('');
      });

      it('should enforce maximum 1000 characters', async () => {
        const schema = createTaskFormSchema('create');
        const longNotes = 'a'.repeat(1001);
        await expect(schema.validateAt('notes', { notes: longNotes })).rejects.toThrow(
          'Notes must be less than 1000 characters'
        );
      });

      it('should accept valid notes', async () => {
        const schema = createTaskFormSchema('create');
        const notes = 'These are valid notes';
        const result = await schema.validateAt('notes', { notes });
        expect(result).toBe(notes);
      });
    });

    describe('icon field', () => {
      it('should require icon field', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('icon', { icon: '' })).rejects.toThrow('Icon is required');
        await expect(schema.validateAt('icon', { icon: null })).rejects.toThrow('Icon is required');
        await expect(schema.validateAt('icon', { icon: undefined })).rejects.toThrow('Icon is required');
      });

      it('should accept valid icon', async () => {
        const schema = createTaskFormSchema('create');
        const result = await schema.validateAt('icon', { icon: '📝' });
        expect(result).toBe('📝');
      });
    });

    describe('color field', () => {
      it('should require color field', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('color', { color: '' })).rejects.toThrow('Color theme is required');
        await expect(schema.validateAt('color', { color: null })).rejects.toThrow('Color theme is required');
        await expect(schema.validateAt('color', { color: undefined })).rejects.toThrow('Color theme is required');
      });

      it('should accept valid color', async () => {
        const schema = createTaskFormSchema('create');
        const result = await schema.validateAt('color', { color: 'ocean' });
        expect(result).toBe('ocean');
      });
    });

    describe('priority field', () => {
      it('should require priority field', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('priority', { priority: '' })).rejects.toThrow('Invalid priority value');
        await expect(schema.validateAt('priority', { priority: null })).rejects.toThrow('Priority is required');
        await expect(schema.validateAt('priority', { priority: undefined })).rejects.toThrow('Priority is required');
      });

      it('should only accept valid priority values', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('priority', { priority: 'invalid' })).rejects.toThrow('Invalid priority value');
        await expect(schema.validateAt('priority', { priority: 'low' })).resolves.toBe('low');
        await expect(schema.validateAt('priority', { priority: 'medium' })).resolves.toBe('medium');
        await expect(schema.validateAt('priority', { priority: 'high' })).resolves.toBe('high');
        await expect(schema.validateAt('priority', { priority: 'urgent' })).resolves.toBe('urgent');
      });
    });

    describe('progress field', () => {
      it('should require progress field', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('progress', { progress: null })).rejects.toThrow('Progress is required');
        await expect(schema.validateAt('progress', { progress: undefined })).rejects.toThrow('Progress is required');
      });

      it('should enforce minimum 0%', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('progress', { progress: -1 })).rejects.toThrow('Progress must be at least 0%');
      });

      it('should enforce maximum 100%', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('progress', { progress: 101 })).rejects.toThrow('Progress cannot exceed 100%');
      });

      it('should accept valid progress values', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('progress', { progress: 0 })).resolves.toBe(0);
        await expect(schema.validateAt('progress', { progress: 50 })).resolves.toBe(50);
        await expect(schema.validateAt('progress', { progress: 100 })).resolves.toBe(100);
      });
    });

    describe('dueDate field', () => {
      beforeEach(() => {
        // Mock current date for consistent testing
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T12:00:00'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should be optional', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('dueDate', { dueDate: null })).resolves.toBeNull();
        await expect(schema.validateAt('dueDate', { dueDate: undefined })).resolves.toBeUndefined();
      });

      it('should require future date in create mode', async () => {
        const schema = createTaskFormSchema('create');
        const pastDate = new Date('2023-12-31T12:00:00');
        const currentDate = new Date('2024-01-01T12:00:00');
        const futureDate = new Date('2024-01-02T12:00:00');

        await expect(schema.validateAt('dueDate', { dueDate: pastDate })).rejects.toThrow(
          'Due date must be in the future'
        );
        await expect(schema.validateAt('dueDate', { dueDate: currentDate })).rejects.toThrow(
          'Due date must be in the future'
        );
        await expect(schema.validateAt('dueDate', { dueDate: futureDate })).resolves.toEqual(futureDate);
      });

      it('should allow any date in edit mode', async () => {
        const schema = createTaskFormSchema('edit');
        const pastDate = new Date('2023-12-31T12:00:00');
        const currentDate = new Date('2024-01-01T12:00:00');
        const futureDate = new Date('2024-01-02T12:00:00');

        await expect(schema.validateAt('dueDate', { dueDate: pastDate })).resolves.toEqual(pastDate);
        await expect(schema.validateAt('dueDate', { dueDate: currentDate })).resolves.toEqual(currentDate);
        await expect(schema.validateAt('dueDate', { dueDate: futureDate })).resolves.toEqual(futureDate);
      });
    });

    describe('dueTime field', () => {
      it('should be optional', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('dueTime', { dueTime: undefined })).resolves.toBeUndefined();
        await expect(schema.validateAt('dueTime', { dueTime: '' })).resolves.toBe('');
        await expect(schema.validateAt('dueTime', { dueTime: '14:30' })).resolves.toBe('14:30');
      });
    });

    describe('tags field', () => {
      it('should require tags array', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('tags', { tags: null })).rejects.toThrow('Tags are required');
        await expect(schema.validateAt('tags', { tags: undefined })).rejects.toThrow('Tags are required');
      });

      it('should require at least one tag', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('tags', { tags: [] })).rejects.toThrow('At least one tag is required');
      });

      it('should enforce maximum 10 tags', async () => {
        const schema = createTaskFormSchema('create');
        const tooManyTags = Array(11).fill('tag');
        await expect(schema.validateAt('tags', { tags: tooManyTags })).rejects.toThrow('Maximum 10 tags allowed');
      });

      it('should require all tags to be strings', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('tags', { tags: ['tag1', null, 'tag3'] })).rejects.toThrow();
        // Yup coerces numbers to strings by default
        const result = await schema.validateAt('tags', { tags: ['tag1', 123, 'tag3'] });
        expect(result).toEqual(['tag1', '123', 'tag3']);
      });

      it('should accept valid tags', async () => {
        const schema = createTaskFormSchema('create');
        const tags = ['work', 'important', 'project'];
        const result = await schema.validateAt('tags', { tags });
        expect(result).toEqual(tags);
      });
    });

    describe('goalId field', () => {
      it('should be optional', async () => {
        const schema = createTaskFormSchema('create');
        await expect(schema.validateAt('goalId', { goalId: undefined })).resolves.toBeUndefined();
        await expect(schema.validateAt('goalId', { goalId: '' })).resolves.toBe('');
        await expect(schema.validateAt('goalId', { goalId: 'goal-123' })).resolves.toBe('goal-123');
      });
    });
  });

  describe('validateTaskForm', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty object for valid data', async () => {
      const validData = {
        name: 'Test Task',
        description: 'Test Description',
        notes: 'Test Notes',
        icon: '📝',
        color: 'ocean',
        priority: 'medium',
        progress: 50,
        dueDate: new Date('2024-01-02T12:00:00'),
        dueTime: '14:30',
        tags: ['work', 'important'],
        goalId: 'goal-123',
      };

      const errors = await validateTaskForm(validData, 'create');
      expect(errors).toEqual({});
    });

    it('should return all validation errors', async () => {
      const invalidData = {
        name: '',
        description: 'a'.repeat(501),
        notes: 'a'.repeat(1001),
        icon: '',
        color: '',
        priority: 'invalid',
        progress: -10,
        dueDate: new Date('2023-12-31T12:00:00'),
        tags: [],
        goalId: 'goal-123',
      };

      const errors = await validateTaskForm(invalidData, 'create');
      expect(errors).toHaveProperty('name', 'Task name must be at least 1 character');
      expect(errors).toHaveProperty('description', 'Description must be less than 500 characters');
      expect(errors).toHaveProperty('notes', 'Notes must be less than 1000 characters');
      expect(errors).toHaveProperty('icon', 'Icon is required');
      expect(errors).toHaveProperty('color', 'Color theme is required');
      expect(errors).toHaveProperty('priority', 'Invalid priority value');
      expect(errors).toHaveProperty('progress', 'Progress must be at least 0%');
      expect(errors).toHaveProperty('dueDate', 'Due date must be in the future');
      expect(errors).toHaveProperty('tags', 'At least one tag is required');
    });

    it('should handle validation exceptions gracefully', async () => {
      // Pass invalid data type to trigger non-ValidationError
      const errors = await validateTaskForm(null as any, 'create');
      expect(errors).toEqual({});
    });

    it('should respect mode parameter for date validation', async () => {
      const dataWithPastDate = {
        name: 'Test Task',
        icon: '📝',
        color: 'ocean',
        priority: 'medium',
        progress: 50,
        dueDate: new Date('2023-12-31T12:00:00'),
        tags: ['work'],
      };

      // Should fail in create mode
      const createErrors = await validateTaskForm(dataWithPastDate, 'create');
      expect(createErrors).toHaveProperty('dueDate', 'Due date must be in the future');

      // Should pass in edit mode
      const editErrors = await validateTaskForm(dataWithPastDate, 'edit');
      expect(editErrors).not.toHaveProperty('dueDate');
    });
  });

  describe('validateField', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should validate individual fields correctly', async () => {
      // Valid cases
      expect(await validateField('name', 'Valid Name', 'create')).toBeNull();
      expect(await validateField('description', 'Valid Description', 'create')).toBeNull();
      expect(await validateField('priority', 'high', 'create')).toBeNull();
      expect(await validateField('progress', 75, 'create')).toBeNull();
      expect(await validateField('tags', ['tag1', 'tag2'], 'create')).toBeNull();

      // Invalid cases
      expect(await validateField('name', '', 'create')).toBe('Task name is required');
      expect(await validateField('name', 'a'.repeat(101), 'create')).toBe('Task name must be less than 100 characters');
      expect(await validateField('priority', 'invalid', 'create')).toBe('Invalid priority value');
      expect(await validateField('progress', 150, 'create')).toBe('Progress cannot exceed 100%');
      expect(await validateField('tags', [], 'create')).toBe('At least one tag is required');
    });

    it('should handle validation exceptions for individual fields', async () => {
      // Invalid field name should return null (no error)
      const result = await validateField('invalidField', 'value', 'create');
      expect(result).toBeNull();
    });

    it('should respect mode for field validation', async () => {
      const pastDate = new Date('2023-12-31T12:00:00');
      
      // Should return error in create mode
      const createError = await validateField('dueDate', pastDate, 'create');
      expect(createError).toBe('Due date must be in the future');

      // Should return null in edit mode
      const editError = await validateField('dueDate', pastDate, 'edit');
      expect(editError).toBeNull();
    });

    it('should handle complex field validation', async () => {
      // Test nested validation (tags array)
      expect(await validateField('tags', ['valid', 'tags'], 'create')).toBeNull();
      expect(await validateField('tags', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], 'create')).toBe(
        'Maximum 10 tags allowed'
      );

      // Test conditional validation (dueDate)
      const futureDate = new Date('2024-01-02T12:00:00');
      expect(await validateField('dueDate', futureDate, 'create')).toBeNull();
      expect(await validateField('dueDate', null, 'create')).toBeNull(); // Optional field
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only input for required fields', async () => {
      const schema = createTaskFormSchema('create');
      await expect(schema.validateAt('name', { name: '   ' })).rejects.toThrow('Task name is required');
    });

    it('should handle non-string input for string fields', async () => {
      const schema = createTaskFormSchema('create');
      // Yup coerces numbers to strings
      const nameResult = await schema.validateAt('name', { name: 123 });
      expect(nameResult).toBe('123');
      
      // Yup also coerces booleans to strings
      const iconResult = await schema.validateAt('icon', { icon: true });
      expect(iconResult).toBe('true');
    });

    it('should handle non-array input for tags', async () => {
      const schema = createTaskFormSchema('create');
      await expect(schema.validateAt('tags', { tags: 'not-an-array' })).rejects.toThrow();
      await expect(schema.validateAt('tags', { tags: {} })).rejects.toThrow();
    });

    it('should handle invalid date objects', async () => {
      const schema = createTaskFormSchema('create');
      await expect(schema.validateAt('dueDate', { dueDate: 'not-a-date' })).rejects.toThrow();
      await expect(schema.validateAt('dueDate', { dueDate: new Date('invalid') })).rejects.toThrow();
    });

    it('should handle floating point progress values', async () => {
      const schema = createTaskFormSchema('create');
      await expect(schema.validateAt('progress', { progress: 50.5 })).resolves.toBe(50.5);
      await expect(schema.validateAt('progress', { progress: 0.1 })).resolves.toBe(0.1);
      await expect(schema.validateAt('progress', { progress: 99.99 })).resolves.toBe(99.99);
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent validation between create and edit modes', async () => {
      const createSchema = createTaskFormSchema('create');
      const editSchema = createTaskFormSchema('edit');

      // Test that most fields have same validation except dueDate
      const testData = {
        name: 'Test',
        icon: '📝',
        color: 'ocean',
        priority: 'medium',
        progress: 50,
        tags: ['test'],
      };

      const createResult = await createSchema.validate(testData, { abortEarly: false }).catch(e => e);
      const editResult = await editSchema.validate(testData, { abortEarly: false }).catch(e => e);

      // Both should pass for basic fields
      expect(createResult).not.toBeInstanceOf(Error);
      expect(editResult).not.toBeInstanceOf(Error);
    });
  });
});
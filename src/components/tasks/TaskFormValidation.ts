import * as yup from 'yup';

export const createTaskFormSchema = (mode: 'create' | 'edit') => yup.object().shape({
  name: yup
    .string()
    .required('Task name is required')
    .min(1, 'Task name must be at least 1 character')
    .max(100, 'Task name must be less than 100 characters')
    .trim(),
  
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  notes: yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  
  icon: yup
    .string()
    .required('Icon is required'),
  
  color: yup
    .string()
    .required('Color theme is required'),
  
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'], 'Invalid priority value')
    .required('Priority is required'),
  
  progress: yup
    .number()
    .min(0, 'Progress must be at least 0%')
    .max(100, 'Progress cannot exceed 100%')
    .required('Progress is required'),
  
  dueDate: yup
    .date()
    .optional()
    .nullable()
    .test('is-future', 'Due date must be in the future', function(value) {
      if (!value) return true; // Optional field
      // Only validate future date for create mode
      if (mode === 'create') {
        return value.getTime() > new Date().getTime();
      }
      return true; // Allow any date in edit mode
    }),
  
  dueTime: yup
    .string()
    .optional(),
  
  tags: yup
    .array()
    .of(yup.string().required())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed')
    .required('Tags are required'),
  
  goalId: yup
    .string()
    .optional()
});

export type TaskFormValidationError = {
  [key: string]: string;
};

export const validateTaskForm = async (data: any, mode: 'create' | 'edit'): Promise<TaskFormValidationError> => {
  try {
    const schema = createTaskFormSchema(mode);
    await schema.validate(data, { abortEarly: false });
    return {};
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: TaskFormValidationError = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return errors;
    }
    return {};
  }
};

export const validateField = async (field: string, value: any, mode: 'create' | 'edit'): Promise<string | null> => {
  try {
    const schema = createTaskFormSchema(mode);
    await schema.validateAt(field, { [field]: value });
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return null;
  }
};
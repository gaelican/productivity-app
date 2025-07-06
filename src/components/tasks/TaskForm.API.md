# TaskForm Component API Documentation

## Overview

The TaskForm component is a reusable, validated form component designed for both creating and editing tasks. It provides a consistent user interface with real-time validation, change detection, and comprehensive task property management.

## Import

```typescript
import { TaskForm, TaskFormData, TaskFormProps } from '@/components/tasks/TaskForm';
```

## Props

### Required Props

#### `mode: 'create' | 'edit'`
Determines the form's behavior and UI elements.
- `'create'`: New task creation mode
- `'edit'`: Existing task editing mode

#### `onSubmit: (data: TaskFormData) => Promise<void>`
Async callback function called when the form is submitted with valid data.
- Receives complete task data
- Should handle saving/updating logic
- Form shows loading state while promise resolves

#### `onCancel: () => void`
Callback function called when the user cancels the form.
- Typically navigates back or closes modal
- In edit mode, may need to handle unsaved changes

### Optional Props

#### `initialValues?: Partial<TaskFormData>`
Pre-populated values for the form fields.
- Used primarily in edit mode
- Can be used in create mode for templates
- All fields are optional

#### `isLoading?: boolean`
Controls the loading state of the submit button.
- Default: `false`
- Disables form submission
- Shows loading indicator in submit button

#### `showProgress?: boolean`
Whether to show the progress slider.
- Default: `true`
- Only visible in edit mode
- Allows 0-100% progress tracking

#### `showNotes?: boolean`
Whether to show the notes field.
- Default: `true`
- Can be hidden for simplified forms

## Data Types

### TaskFormData

```typescript
interface TaskFormData {
  name: string;              // Required, 1-100 characters
  description?: string;      // Optional, max 500 characters
  notes?: string;           // Optional, max 1000 characters
  icon: string;             // Emoji icon, default: '📝'
  color: string;            // Gradient theme ID
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;           // Optional due date
  dueTime?: string;         // Time component (HH:MM format)
  tags: string[];           // Array of tag strings
  goalId?: string;          // Linked goal ID
  progress: number;         // 0-100 completion percentage
}
```

## Usage Examples

### Basic Create Mode

```typescript
import { TaskForm } from '@/components/tasks/TaskForm';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '@/hooks/useDatabase';

export const TaskCreateScreen = () => {
  const navigation = useNavigation();
  const database = useDatabase();
  
  const handleSubmit = async (data: TaskFormData) => {
    await database.get('tasks').create({
      ...data,
      userId: auth.currentUser.id,
      createdAt: new Date(),
    });
    navigation.goBack();
  };
  
  return (
    <TaskForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
};
```

### Edit Mode with Initial Values

```typescript
export const TaskEditScreen = ({ route }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    loadTask(taskId).then(setTask);
  }, [taskId]);
  
  const handleSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    try {
      await task.update(data);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!task) return <LoadingView />;
  
  return (
    <TaskForm
      mode="edit"
      initialValues={{
        name: task.name,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        tags: task.tags,
        goalId: task.goalId,
        progress: task.progress,
        icon: task.icon,
        color: task.color,
        notes: task.notes,
      }}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
      isLoading={isLoading}
      showProgress={true}
    />
  );
};
```

### With Pre-filled Natural Language

```typescript
export const TaskCreateWithPrefill = ({ route }) => {
  const { prefillText } = route.params;
  const parsed = parseNaturalLanguage(prefillText);
  
  return (
    <TaskForm
      mode="create"
      initialValues={{
        name: parsed.title,
        description: parsed.description,
        dueDate: parsed.dueDate,
        priority: parsed.priority || 'medium',
        tags: parsed.tags || [],
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};
```

### Minimal Form (No Notes/Progress)

```typescript
<TaskForm
  mode="create"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  showNotes={false}
  showProgress={false}
/>
```

## Validation

The form includes comprehensive validation with the following rules:

### Field Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, 1-100 chars | "Task name is required" / "Task name is too long" |
| description | Max 500 chars | "Description is too long" |
| notes | Max 1000 chars | "Notes are too long" |
| tags | Max 10 tags, 20 chars each | "Too many tags" / "Tag is too long" |
| dueDate | Future date (create only) | "Due date must be in the future" |
| progress | 0-100 range | "Progress must be between 0 and 100" |

### Validation Behavior

1. **Field-level validation**: Triggered on blur
2. **Form-level validation**: Triggered on submit
3. **Visual feedback**: Red border and error message
4. **Submit button state**: Disabled when invalid

## Features

### Change Detection (Edit Mode)
- Tracks all field modifications
- Submit button disabled when no changes
- Can implement unsaved changes warning

### Real-time Validation
- Validates fields as user types (debounced)
- Shows errors only after field is touched
- Clear error messages below fields

### Gradient Theme Selection
- Visual picker with 30+ gradients
- Tiered based on device capabilities
- Preview in real-time

### Progress Tracking (Edit Mode)
- Slider with preset buttons (0%, 25%, 50%, 75%, 100%)
- Visual progress bar with gradient fill
- Updates task completion status

### Tag Management
- Add/remove tags dynamically
- Autocomplete suggestions
- Tag validation and limits

### Goal Linking
- Dropdown with active goals
- Shows goal progress and color
- Optional field

## Accessibility

- Full keyboard navigation support
- Screen reader labels on all inputs
- Proper focus management
- High contrast mode support
- Touch targets meet minimum size requirements

## Performance

- Memoized child components
- Debounced validation
- Optimized re-renders
- Lazy-loaded heavy components (gradient picker)

## Styling

The component uses a consistent design system with:
- Proper spacing and padding
- Responsive layout
- Platform-specific adjustments
- Theme support (future enhancement)

## Error Handling

```typescript
const handleSubmit = async (data: TaskFormData) => {
  try {
    await saveTask(data);
    showSuccess('Task saved successfully');
    navigation.goBack();
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      showError('No internet connection');
    } else {
      showError('Failed to save task');
    }
    console.error('Task save error:', error);
  }
};
```

## Testing

The component includes comprehensive test coverage:
- Unit tests for validation logic
- Integration tests for form submission
- Accessibility tests
- Visual regression tests

See `TaskForm.test.tsx` for examples.

## Migration from Legacy Forms

If migrating from custom form implementations:

1. Map your data structure to `TaskFormData`
2. Replace form JSX with `<TaskForm />`
3. Move save logic to `onSubmit` handler
4. Remove redundant validation code
5. Update navigation handling

## Future Enhancements

Planned improvements:
- Subtask support
- Recurring task options
- File attachments
- Voice input
- Template system
- Batch creation mode
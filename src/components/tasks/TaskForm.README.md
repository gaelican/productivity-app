# TaskForm Component

A reusable form component for creating and editing tasks in the mobile app.

## Features

- **Dual Mode Support**: Works for both creating new tasks and editing existing tasks
- **Comprehensive Fields**: Includes all task properties (name, description, notes, priority, due date, progress, tags, goals, icon, and color theme)
- **Smart Validation**: Tracks changes in edit mode and prevents submission without modifications
- **Responsive Design**: Keyboard-aware with proper scroll handling
- **Theme Integration**: Full gradient theme picker with visual previews
- **Progress Tracking**: Visual progress bar with quick selection buttons (edit mode only)

## Usage

### For Creating Tasks

```tsx
import { TaskForm, TaskFormData } from '@/components/tasks';

const TaskCreateScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      await taskRepository.create({
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        priority: data.priority,
        dueDate: data.dueDate?.getTime(),
        tags: data.tags,
        goalId: data.goalId,
        // ... other fields
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaskForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
      isLoading={loading}
      showProgress={false} // Progress is only for editing
      showNotes={false}    // Optional: hide notes field
    />
  );
};
```

### For Editing Tasks

```tsx
import { TaskForm, TaskFormData } from '@/components/tasks';

const TaskEditScreen = () => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      await taskRepository.update(task.id, {
        name: data.name,
        description: data.description,
        notes: data.notes,
        icon: data.icon,
        color: data.color,
        priority: data.priority,
        dueDate: data.dueDate?.getTime(),
        tags: data.tags,
        progress: data.progress,
        goalId: data.goalId,
      });
      Alert.alert('Success', 'Task updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const initialValues: Partial<TaskFormData> = {
    name: task.name,
    description: task.description,
    notes: task.notes,
    icon: task.icon,
    color: task.color,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    tags: task.tags || [],
    goalId: task.goalId,
    progress: task.progress,
  };

  return (
    <TaskForm
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
      isLoading={loading}
    />
  );
};
```

## Props

### TaskFormProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `mode` | `'create' \| 'edit'` | Yes | - | Form mode determining validation and UI behavior |
| `initialValues` | `Partial<TaskFormData>` | No | `{}` | Initial form values for pre-population |
| `onSubmit` | `(data: TaskFormData) => Promise<void>` | Yes | - | Callback when form is submitted with valid data |
| `onCancel` | `() => void` | Yes | - | Callback when user cancels the form |
| `isLoading` | `boolean` | No | `false` | Shows loading state and disables interactions |
| `showProgress` | `boolean` | No | `true` | Whether to show the progress slider (edit mode only) |
| `showNotes` | `boolean` | No | `true` | Whether to show the notes field |

### TaskFormData

```typescript
interface TaskFormData {
  name: string;
  description?: string;
  notes?: string;
  icon: string;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  dueTime?: string;
  tags: string[];
  goalId?: string;
  progress: number;
}
```

## Features by Mode

### Create Mode
- Clean form with empty fields
- No progress tracking
- Submit button labeled "Create Task"
- No change tracking

### Edit Mode
- Pre-populated fields from `initialValues`
- Progress slider with quick selection buttons
- Submit button labeled "Save Changes"
- Change tracking - submit disabled if no changes
- Shows current progress percentage

## Styling

The component uses a consistent design system:
- Light backgrounds with subtle borders
- Purple accent color (#6366F1) for primary actions
- Gradient previews for color themes
- Responsive spacing and typography
- Platform-specific keyboard handling

## Dependencies

The TaskForm component relies on these child components:
- `IconPicker` - For selecting task icons
- `PrioritySelector` - For setting task priority
- `DateTimePickerComponent` - For due date selection
- `TagInput` - For managing task tags
- `GoalSelector` - For linking tasks to goals
- `GradientThemeManager` - For color theme management

## Best Practices

1. **Validation**: Always validate required fields before submission
2. **Loading States**: Show loading indicators during async operations
3. **Error Handling**: Provide clear error messages to users
4. **Keyboard Management**: The form handles keyboard automatically
5. **Performance**: Form state is optimized to prevent unnecessary re-renders

## Migration Guide

To migrate from inline forms to TaskForm:

1. Extract form state and logic
2. Map your data to `TaskFormData` interface
3. Replace form JSX with `<TaskForm />` component
4. Move submission logic to `onSubmit` callback
5. Test both create and edit modes thoroughly
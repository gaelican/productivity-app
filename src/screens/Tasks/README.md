# Task Management Navigation Flows

## Overview
The task management system provides comprehensive create and edit functionality with multiple entry points throughout the app.

## Task Creation Flows

### 1. From Dashboard
- **Quick Add**: Inline natural language input at the top of the Dashboard
- Creates tasks directly with parsed properties (due date, priority, tags)
- No navigation required - instant creation

### 2. From Task List Screen
- **"+ New" Button**: Located in the header
- Navigates to `TaskCreateScreen` with full creation options
- Supports both natural language and form-based input

### 3. From Navigation
```typescript
navigation.navigate('TaskCreate', { 
  prefillText?: string // Optional pre-filled natural language text
});
```

## Task Editing Flows

### 1. From Dashboard
- Tap on any task card to expand
- Click edit button in expanded view
- Navigates to `TaskEditScreen` with task data pre-populated

### 2. From Task List Screen
- Tap on any task to expand
- Click edit button in expanded view
- Navigates to `TaskEditScreen`

### 3. From TaskExpandedView
- Edit button in the header
- Automatically navigates to edit screen

### 4. From Navigation
```typescript
navigation.navigate('TaskEdit', { 
  taskId: string // Required task ID
});
```

## Screen Components

### TaskCreateScreen
- **Location**: `/screens/Tasks/TaskCreateScreen.tsx`
- **Features**:
  - Dual mode: Natural language or form-based input
  - Real-time parsing preview
  - All task properties editable
  - Gradient theme selection
  - Goal linking

### TaskEditScreen
- **Location**: `/screens/Tasks/TaskEditScreen.tsx`
- **Features**:
  - Pre-populated with existing task data
  - Unsaved changes warning
  - Progress tracking slider
  - Complete/uncomplete functionality
  - Delete with confirmation
  - Shows creation/completion metadata

## Shared Components

All task creation/editing screens use these reusable components:

1. **DateTimePicker**: Cross-platform date/time selection
2. **PrioritySelector**: Visual priority level selector
3. **TagInput**: Tag management with autocomplete
4. **GoalSelector**: Link tasks to active goals
5. **IconPicker**: Emoji icon selection modal

## Integration Points

### Dashboard
```typescript
const handleTaskEdit = (task: Task) => {
  navigation.navigate('TaskEdit', { taskId: task.id });
};
```

### TaskListScreen
```typescript
// Create button
<TouchableOpacity onPress={() => navigation.navigate('TaskCreate')}>
  <Text style={styles.createButton}>+ New</Text>
</TouchableOpacity>

// Edit navigation
const handleTaskEdit = (task: Task) => {
  navigation.navigate('TaskEdit', { taskId: task.id });
};
```

### TaskExpandedView
```typescript
// Already integrated with onEdit callback
onEdit={(task) => navigation.navigate('TaskEdit', { taskId: task.id })}
```

## Navigation Stack Configuration

In `RootNavigator.tsx`:
```typescript
<Stack.Screen 
  name="TaskCreate" 
  component={TaskCreateScreen}
  options={{
    presentation: 'modal',
    headerShown: false,
  }}
/>

<Stack.Screen 
  name="TaskEdit" 
  component={TaskEditScreen}
  options={{
    presentation: 'modal',
    headerShown: false,
  }}
/>
```

## Best Practices

1. **Modal Presentation**: Both create and edit screens use modal presentation for better UX
2. **No Headers**: Screens implement their own headers with cancel/save actions
3. **Validation**: Task name is required, all other fields are optional
4. **Auto-save**: No auto-save - explicit save action required
5. **Data Consistency**: Uses WatermelonDB repositories for all operations
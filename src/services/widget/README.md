# Widget Data Synchronization Service

This service provides automatic synchronization between the React Native app's WatermelonDB database and Android home screen widgets.

## Architecture

### WidgetSyncService.ts
The core service that:
- Observes WatermelonDB task changes using reactive queries
- Converts tasks to a widget-friendly format
- Updates widgets via the native WidgetModule
- Handles widget events (task completion)
- Implements debouncing to prevent excessive updates

### useWidgetSync.tsx
React hook that:
- Sets up the widget sync service
- Manages lifecycle (start/stop sync)
- Handles app state changes (refresh on foreground)
- Provides manual refresh capability

### Integration Points

1. **App.tsx** - The hook is used in the AppContent component to start syncing when the app launches
2. **WidgetModule** - Native module interface for widget communication (stub implementation provided)
3. **WatermelonDB** - Reactive queries observe task changes

## Features

- **Automatic Sync**: Tasks automatically sync to widgets when changed
- **Platform Detection**: Only runs on Android devices
- **Performance Optimized**: 
  - Debounced updates (300ms)
  - Limited to 10 tasks for widget performance
  - Only shows incomplete tasks
- **Error Handling**: Graceful error handling throughout
- **App State Management**: Refreshes widget data when app comes to foreground

## Usage

The service is automatically initialized when the app starts. No manual setup required.

To manually refresh widgets:
```tsx
const { refreshWidget } = useWidgetSync();
refreshWidget();
```

## Native Module Implementation

The WidgetModule needs to be implemented in Android native code with these methods:
- `updateTaskList(tasks: WidgetTask[]): Promise<void>`
- `clearWidget(): Promise<void>`

And emit these events:
- `onTaskCompleted` with `{ taskId: string }`

## Data Format

Tasks are converted to this format for widgets:
```typescript
interface WidgetTask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string; // ISO 8601 format
  priority?: string;
}
```
// Hook to sync task data with widgets
import { useEffect, useCallback } from 'react';
import { widgetBridge } from './index';
import type { WidgetData, WidgetTask } from '@productivity/widget-shared';
import { filterTasksForWidget, WIDGET_CONSTRAINTS } from '@productivity/widget-shared';

interface UseWidgetSyncOptions {
  widgetId: string;
  tasks: any[]; // Your app's task type
  filter?: 'today' | 'upcoming' | 'all' | 'routine';
  enabled?: boolean;
}

export function useWidgetSync({
  widgetId,
  tasks,
  filter = 'today',
  enabled = true
}: UseWidgetSyncOptions) {
  
  // Convert app tasks to widget tasks
  const convertToWidgetTasks = useCallback((appTasks: any[]): WidgetTask[] => {
    return appTasks.map(task => ({
      id: task.id,
      title: task.name || task.title,
      dueDate: task.dueDate ? new Date(task.dueDate).getTime() : undefined,
      dueTime: task.dueTime,
      color: task.color || '#3B82F6',
      icon: task.icon || 'checkmark',
      completed: task.completed || false,
      priority: task.priority || 'medium'
    }));
  }, []);

  // Sync data to widget
  const syncToWidget = useCallback(async () => {
    if (!enabled) return;

    try {
      const widgetTasks = convertToWidgetTasks(tasks);
      const widgetData: WidgetData = {
        tasks: filterTasksForWidget(widgetTasks, {
          widgetId,
          type: 'medium',
          filter,
          maxTasks: 10,
          theme: 'auto'
        }),
        lastUpdated: Date.now(),
        config: {
          widgetId,
          type: 'medium',
          filter,
          maxTasks: 10,
          theme: 'auto'
        }
      };

      await widgetBridge.updateWidgetData(widgetId, widgetData);
    } catch (error) {
      console.error('Failed to sync widget data:', error);
    }
  }, [enabled, widgetId, tasks, filter, convertToWidgetTasks]);

  // Sync on mount and when tasks change
  useEffect(() => {
    syncToWidget();
  }, [syncToWidget]);

  // Handle widget events
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = widgetBridge.onWidgetEvent((event) => {
      if (event.type === 'TASK_COMPLETED' && event.taskId) {
        // Handle task completion from widget
        // You would update your app's task state here
        console.log('Task completed from widget:', event.taskId);
      }
    });

    return unsubscribe;
  }, [enabled]);

  return {
    syncToWidget,
    forceUpdate: () => widgetBridge.forceUpdateAll()
  };
}

// Example usage in a React component:
/*
function TaskListScreen() {
  const tasks = useSelector(selectTasks);
  
  // Sync today's tasks to widget
  const { syncToWidget } = useWidgetSync({
    widgetId: 'home-widget',
    tasks: tasks,
    filter: 'today'
  });

  // Manual sync after task update
  const completeTask = async (taskId: string) => {
    await updateTaskInDatabase(taskId, { completed: true });
    await syncToWidget();
  };

  return <TaskList tasks={tasks} onComplete={completeTask} />;
}
*/
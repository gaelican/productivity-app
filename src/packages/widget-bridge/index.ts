import { NativeModules, Platform } from 'react-native';

// Define the interface for our widget bridge
interface IWidgetBridge {
  updateWidget(data: WidgetData): Promise<void>;
  refreshWidget(): Promise<void>;
  isWidgetSupported(): Promise<boolean>;
}

// Define the data structure for widget updates
export interface WidgetData {
  tasks: Task[];
  lastUpdated?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Native module implementation
const { WidgetBridgeModule } = NativeModules;

class WidgetBridgeImpl implements IWidgetBridge {
  async updateWidget(data: WidgetData): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('Widget updates are only supported on Android');
      return;
    }

    if (!WidgetBridgeModule) {
      console.warn('WidgetBridgeModule is not available. Make sure the native module is properly linked.');
      return;
    }

    try {
      await WidgetBridgeModule.updateWidget({
        ...data,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update widget:', error);
      throw error;
    }
  }

  async refreshWidget(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('Widget refresh is only supported on Android');
      return;
    }

    if (!WidgetBridgeModule) {
      console.warn('WidgetBridgeModule is not available. Make sure the native module is properly linked.');
      return;
    }

    try {
      await WidgetBridgeModule.refreshWidget();
    } catch (error) {
      console.error('Failed to refresh widget:', error);
      throw error;
    }
  }

  async isWidgetSupported(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!WidgetBridgeModule) {
      return false;
    }

    try {
      return await WidgetBridgeModule.isWidgetSupported();
    } catch (error) {
      console.error('Failed to check widget support:', error);
      return false;
    }
  }
}

// Export the singleton instance
export const WidgetBridge = new WidgetBridgeImpl();

// Export types
export type { IWidgetBridge };
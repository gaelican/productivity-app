import { NativeModules, Platform } from 'react-native';

interface IWidgetModule {
  updateTaskList: (tasks: any[]) => Promise<void>;
  clearWidget: () => Promise<void>;
}

// Stub implementation for development
// The actual native module will be implemented in Android native code
const WidgetModuleStub: IWidgetModule = {
  updateTaskList: async (tasks: any[]) => {
    if (__DEV__) {
      console.log('WidgetModule.updateTaskList called with:', tasks.length, 'tasks');
    }
    // In production, this would call the native module
    return Promise.resolve();
  },
  
  clearWidget: async () => {
    if (__DEV__) {
      console.log('WidgetModule.clearWidget called');
    }
    // In production, this would call the native module
    return Promise.resolve();
  }
};

// Export either the native module or the stub
export const WidgetModule: IWidgetModule = Platform.OS === 'android' 
  ? (NativeModules.WidgetModule || WidgetModuleStub)
  : WidgetModuleStub;
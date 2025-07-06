import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import { DeviceTier } from '../../packages/types';

interface DeviceInfo {
  ram: number;
  cpuCores: number;
  modelName: string;
  osVersion: string;
  isSimulator: boolean;
}

interface AnimationBudget {
  maxConcurrent: number;
  backgroundAnimations: boolean | 'limited' | 'full';
  transitionDuration: number;
  particleEffects: boolean;
}

class DeviceTierDetector {
  private static instance: DeviceTierDetector;
  private cachedTier: DeviceTier | null = null;
  private batteryLevel: number = 100;
  private batteryStateListener: any = null;

  private constructor() {
    this.initializeBatteryMonitoring();
  }

  static getInstance(): DeviceTierDetector {
    if (!DeviceTierDetector.instance) {
      DeviceTierDetector.instance = new DeviceTierDetector();
    }
    return DeviceTierDetector.instance;
  }

  private async initializeBatteryMonitoring(): Promise<void> {
    try {
      // Get initial battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      this.batteryLevel = batteryLevel * 100;

      // Subscribe to battery level changes
      this.batteryStateListener = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        this.batteryLevel = batteryLevel * 100;
      });
    } catch (error) {
      console.warn('Battery monitoring not available:', error);
      // Default to 100% if battery API not available
      this.batteryLevel = 100;
    }
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      ram: Device.totalMemory ? Device.totalMemory / (1024 * 1024 * 1024) : 4, // Convert to GB
      cpuCores: Device.supportedCpuArchitectures?.length || 4,
      modelName: Device.modelName || 'Unknown',
      osVersion: Device.osVersion || '0',
      isSimulator: !Device.isDevice,
    };
  }

  detectTier(forceRefresh: boolean = false): DeviceTier {
    if (this.cachedTier && !forceRefresh) {
      return this.cachedTier;
    }

    const deviceInfo = this.getDeviceInfo();

    // Always basic tier for simulators (for testing)
    if (deviceInfo.isSimulator) {
      this.cachedTier = 'basic';
      return this.cachedTier;
    }

    // Platform-specific tier detection
    if (Platform.OS === 'ios') {
      this.cachedTier = this.detectIOSTier(deviceInfo);
    } else if (Platform.OS === 'android') {
      this.cachedTier = this.detectAndroidTier(deviceInfo);
    } else {
      // Default to standard for web or other platforms
      this.cachedTier = 'standard';
    }

    return this.cachedTier;
  }

  private detectIOSTier(info: DeviceInfo): DeviceTier {
    // iOS devices generally have good performance
    // Check by model year (approximation based on model name)
    const modelYear = this.getIOSModelYear(info.modelName);
    
    if (modelYear >= 2021) {
      return 'premium'; // iPhone 13 and newer
    } else if (modelYear >= 2019) {
      return 'standard'; // iPhone 11 to 12
    } else {
      return 'basic'; // Older devices
    }
  }

  private detectAndroidTier(info: DeviceInfo): DeviceTier {
    // Android tier based on RAM and CPU cores
    if (info.ram < 3) {
      return 'basic'; // Less than 3GB RAM
    } else if (info.ram < 6 || info.cpuCores < 6) {
      return 'standard'; // 3-6GB RAM or fewer cores
    } else {
      return 'premium'; // 6GB+ RAM and 6+ cores
    }
  }

  private getIOSModelYear(modelName: string): number {
    // Simplified model year detection
    const modelPatterns: Record<string, number> = {
      'iPhone 15': 2023,
      'iPhone 14': 2022,
      'iPhone 13': 2021,
      'iPhone 12': 2020,
      'iPhone 11': 2019,
      'iPhone X': 2018,
      'iPhone SE (3rd generation)': 2022,
      'iPhone SE (2nd generation)': 2020,
      'iPad Pro': 2021, // Assume newer iPad Pro
      'iPad Air': 2020,
      'iPad': 2019,
    };

    for (const [pattern, year] of Object.entries(modelPatterns)) {
      if (modelName.includes(pattern)) {
        return year;
      }
    }

    // Default to older device if unknown
    return 2018;
  }

  getAnimationBudget(overrideTier?: DeviceTier): AnimationBudget {
    const tier = overrideTier || this.detectTier();
    const batteryLevel = this.getBatteryLevel();

    // No animations if battery is critically low
    if (batteryLevel < 20) {
      return {
        maxConcurrent: 0,
        backgroundAnimations: false,
        transitionDuration: 0,
        particleEffects: false,
      };
    }

    // Reduced animations if battery is low
    if (batteryLevel < 30) {
      return {
        maxConcurrent: tier === 'premium' ? 1 : 0,
        backgroundAnimations: false,
        transitionDuration: tier === 'basic' ? 0 : 200,
        particleEffects: false,
      };
    }

    // Normal animation budget based on tier
    switch (tier) {
      case 'basic':
        return {
          maxConcurrent: 0,
          backgroundAnimations: false,
          transitionDuration: 0,
          particleEffects: false,
        };
      
      case 'standard':
        return {
          maxConcurrent: 2,
          backgroundAnimations: 'limited',
          transitionDuration: 300,
          particleEffects: false,
        };
      
      case 'premium':
        return {
          maxConcurrent: 3,
          backgroundAnimations: 'full',
          transitionDuration: 400,
          particleEffects: true,
        };
    }
  }

  getBatteryLevel(): number {
    return this.batteryLevel;
  }

  shouldAnimate(priority: 'high' | 'medium' | 'low' = 'medium'): boolean {
    const budget = this.getAnimationBudget();
    
    if (budget.maxConcurrent === 0) {
      return false;
    }

    // High priority animations always allowed if budget permits
    if (priority === 'high' && budget.maxConcurrent > 0) {
      return true;
    }

    // Medium and low priority need standard or premium tier
    const tier = this.detectTier();
    return tier !== 'basic' && this.batteryLevel >= 30;
  }

  getGradientCount(): number {
    const tier = this.detectTier();
    
    switch (tier) {
      case 'basic':
        return 10; // Core gradients only
      case 'standard':
        return 20; // Extended set
      case 'premium':
        return 30; // Full palette
    }
  }

  cleanup(): void {
    if (this.batteryStateListener) {
      this.batteryStateListener.remove();
      this.batteryStateListener = null;
    }
  }
}

// Export singleton instance
export const deviceTierDetector = DeviceTierDetector.getInstance();

// Export types
export type { AnimationBudget };
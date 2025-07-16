#!/bin/bash

# Solution B: AsyncStorage Stub
# This script creates a complete stub AsyncStorage module that satisfies
# the dependency requirements without including the actual implementation

echo "=== Applying Solution B: AsyncStorage Stub ==="

# Create stub directory structure
STUB_DIR="node_modules/@react-native-async-storage/async-storage"
echo "Creating AsyncStorage stub at $STUB_DIR..."

# Remove existing module if present
rm -rf "$STUB_DIR"
mkdir -p "$STUB_DIR/android/src/main/java/com/reactnativecommunity/asyncstorage"
mkdir -p "$STUB_DIR/src"

# Create package.json
cat > "$STUB_DIR/package.json" << 'EOF'
{
  "name": "@react-native-async-storage/async-storage",
  "version": "1.19.3",
  "description": "Stub implementation of AsyncStorage",
  "main": "src/index.js",
  "react-native": "src/index.js",
  "types": "src/index.d.ts",
  "files": [
    "android",
    "ios",
    "src"
  ],
  "keywords": ["react-native", "asyncstorage", "stub"],
  "license": "MIT"
}
EOF

# Create JavaScript implementation
cat > "$STUB_DIR/src/index.js" << 'EOF'
// Stub implementation of AsyncStorage
const AsyncStorage = {
  getItem: async (key) => {
    console.warn('AsyncStorage.getItem called with key:', key);
    return null;
  },
  setItem: async (key, value) => {
    console.warn('AsyncStorage.setItem called with key:', key, 'value:', value);
  },
  removeItem: async (key) => {
    console.warn('AsyncStorage.removeItem called with key:', key);
  },
  clear: async () => {
    console.warn('AsyncStorage.clear called');
  },
  getAllKeys: async () => {
    console.warn('AsyncStorage.getAllKeys called');
    return [];
  },
  multiGet: async (keys) => {
    console.warn('AsyncStorage.multiGet called');
    return keys.map(key => [key, null]);
  },
  multiSet: async (keyValuePairs) => {
    console.warn('AsyncStorage.multiSet called');
  },
  multiRemove: async (keys) => {
    console.warn('AsyncStorage.multiRemove called');
  }
};

export default AsyncStorage;
EOF

# Create TypeScript definitions
cat > "$STUB_DIR/src/index.d.ts" << 'EOF'
export interface AsyncStorageStatic {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

declare const AsyncStorage: AsyncStorageStatic;
export default AsyncStorage;
EOF

# Create Android stub implementation
cat > "$STUB_DIR/android/build.gradle" << 'EOF'
buildscript {
    ext.safeExtGet = {prop, fallback ->
        rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
    }
}

apply plugin: 'com.android.library'

android {
    compileSdkVersion safeExtGet('compileSdkVersion', 33)
    
    namespace "com.reactnativecommunity.asyncstorage"
    
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        targetSdkVersion safeExtGet('targetSdkVersion', 33)
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
EOF

# Create Android manifest
mkdir -p "$STUB_DIR/android/src/main"
cat > "$STUB_DIR/android/src/main/AndroidManifest.xml" << 'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.reactnativecommunity.asyncstorage">
</manifest>
EOF

# Create stub Java implementation
cat > "$STUB_DIR/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java" << 'EOF'
package com.reactnativecommunity.asyncstorage;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AsyncStoragePackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AsyncStorageModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
EOF

# Create stub module
cat > "$STUB_DIR/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageModule.java" << 'EOF'
package com.reactnativecommunity.asyncstorage;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class AsyncStorageModule extends ReactContextBaseJavaModule {
    public AsyncStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AsyncStorage";
    }

    @ReactMethod
    public void multiGet(com.facebook.react.bridge.ReadableArray keys, Promise promise) {
        promise.resolve(null);
    }

    @ReactMethod
    public void multiSet(com.facebook.react.bridge.ReadableArray keyValueArray, Promise promise) {
        promise.resolve(null);
    }

    @ReactMethod
    public void multiRemove(com.facebook.react.bridge.ReadableArray keys, Promise promise) {
        promise.resolve(null);
    }

    @ReactMethod
    public void clear(Promise promise) {
        promise.resolve(null);
    }
}
EOF

echo "✓ AsyncStorage stub created successfully!"
echo "Note: This is a stub implementation that logs warnings when used."
echo "It satisfies build requirements but doesn't persist data."
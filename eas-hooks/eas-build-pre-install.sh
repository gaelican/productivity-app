#!/bin/bash
set -e

echo "🔧 Running pre-install hook for EAS Build..."

# Clean any potential gradle caches
echo "🧹 Cleaning potential gradle caches..."
rm -rf ~/.gradle/caches/transforms-*/files-*/*/react-native-async-storage*
rm -rf ~/.gradle/caches/modules-*/files-*/com.reactnativecommunity/async-storage
rm -rf ~/.gradle/caches/modules-*/files-*/*/@react-native-async-storage

# Create a proper dummy AsyncStorage module structure
echo "📦 Creating comprehensive dummy AsyncStorage module..."
ASYNC_STORAGE_DIR="node_modules/@react-native-async-storage/async-storage"
mkdir -p "$ASYNC_STORAGE_DIR/android/src/main/java/com/reactnativecommunity/asyncstorage"
mkdir -p "$ASYNC_STORAGE_DIR/android/src/main/res/values"

# Create package.json
cat > "$ASYNC_STORAGE_DIR/package.json" << 'EOF'
{
  "name": "@react-native-async-storage/async-storage",
  "version": "0.0.1-dummy",
  "description": "Dummy package to prevent build errors",
  "main": "index.js",
  "react-native": "index.js",
  "types": "index.d.ts",
  "files": [
    "android",
    "index.js",
    "index.d.ts"
  ],
  "keywords": ["react-native"],
  "license": "MIT"
}
EOF

# Create JavaScript module
cat > "$ASYNC_STORAGE_DIR/index.js" << 'EOF'
// Dummy AsyncStorage implementation to prevent import errors
const AsyncStorage = {
  getItem: async (key) => null,
  setItem: async (key, value) => {},
  removeItem: async (key) => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async (keys) => [],
  multiSet: async (kvPairs) => {},
  multiRemove: async (keys) => {},
  mergeItem: async (key, value) => {},
  multiMerge: async (kvPairs) => {}
};

export default AsyncStorage;
EOF

# Create TypeScript definitions
cat > "$ASYNC_STORAGE_DIR/index.d.ts" << 'EOF'
declare const AsyncStorage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(kvPairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  mergeItem(key: string, value: string): Promise<void>;
  multiMerge(kvPairs: [string, string][]): Promise<void>;
};
export default AsyncStorage;
EOF

# Create proper Android module structure
cat > "$ASYNC_STORAGE_DIR/android/build.gradle" << 'EOF'
apply plugin: 'com.android.library'

android {
    compileSdkVersion 34
    namespace "com.reactnativecommunity.asyncstorage"
    
    defaultConfig {
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "0.0.1"
    }
    
    lintOptions {
        abortOnError false
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
EOF

# Create AndroidManifest.xml
cat > "$ASYNC_STORAGE_DIR/android/src/main/AndroidManifest.xml" << 'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.reactnativecommunity.asyncstorage">
</manifest>
EOF

# Create a dummy Java implementation
cat > "$ASYNC_STORAGE_DIR/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java" << 'EOF'
package com.reactnativecommunity.asyncstorage;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

public class AsyncStoragePackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
EOF

# Create react-native.config.js to disable autolinking for this module
cat > "$ASYNC_STORAGE_DIR/react-native.config.js" << 'EOF'
module.exports = {
  dependency: {
    platforms: {
      android: null,
      ios: null
    }
  }
};
EOF

# Also create the alternative package name structure that gradle might look for
ALT_ASYNC_DIR="node_modules/react-native-async-storage"
mkdir -p "$ALT_ASYNC_DIR"
cp -r "$ASYNC_STORAGE_DIR"/* "$ALT_ASYNC_DIR/" 2>/dev/null || true

# Create a file to indicate this is a dummy module
echo "This is a dummy module created to prevent build errors" > "$ASYNC_STORAGE_DIR/.dummy"

echo "✅ Pre-install hook complete - dummy AsyncStorage module created"

# Log what we created for debugging
echo "📂 Created files:"
find "$ASYNC_STORAGE_DIR" -type f | head -20
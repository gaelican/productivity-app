# React Native 0.74.5 Gradle Plugin Issue - Complete Solution

## The Problem

Build #9 failed with "Gradle build failed with unknown error" because of a fundamental issue with how React Native 0.74.5 handles its gradle plugin in EAS builds.

## Root Cause Analysis

### 1. **Plugin Distribution Change**
- **Old versions (< 0.71)**: The `com.facebook.react:react-native-gradle-plugin` was published to Maven Central
- **New versions (0.74.5)**: The plugin is distributed via npm as `@react-native/gradle-plugin` and lives in node_modules

### 2. **The Chicken-and-Egg Problem**
```
EAS Build Process:
1. Evaluate gradle files (settings.gradle, build.gradle) ← Plugin needed here
2. Run npm install                                      ← Plugin installed here
3. Run gradle build
```

The plugin is needed BEFORE it's available!

### 3. **Why Your Build Failed**
- Your `build.gradle` tried to fetch `com.facebook.react:react-native-gradle-plugin` from Maven Central
- This artifact doesn't exist for version 0.74.5
- The plugin actually lives in `node_modules/@react-native/gradle-plugin` after npm install

## The Solution

### 1. **Updated settings.gradle**
```gradle
rootProject.name = 'ProductivityApp'

// Check if node_modules exists (for EAS compatibility)
def nodeModulesDir = new File(rootDir, '../node_modules')
if (nodeModulesDir.exists()) {
    // Include the React Native gradle plugin from node_modules
    pluginManagement {
        includeBuild("../node_modules/@react-native/gradle-plugin")
    }
    
    // Apply the React Native settings plugin
    plugins {
        id("com.facebook.react.settings")
    }
    
    // Configure React Native settings
    extensions.configure(com.facebook.react.ReactSettingsExtension){ ex ->
        ex.autolinkLibrariesFromCommand()
    }
    
    // Apply other scripts...
} else {
    // Minimal configuration when node_modules doesn't exist yet
    println("Warning: node_modules not found. Using minimal configuration.")
}

include ':app'
```

### 2. **Updated build.gradle**
```gradle
dependencies {
    classpath('com.android.tools.build:gradle:8.1.0')
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    classpath("com.facebook.react:react-native-gradle-plugin") // No version!
}
```

### 3. **EAS Build Hooks**
Created pre/post install hooks to handle the timing issue:

**eas-build-pre-install.sh**: Uses minimal settings.gradle
**eas-build-post-install.sh**: Restores full settings.gradle

### 4. **Gradle Version**
Downgraded from 8.7 to 8.6 (tested with RN 0.74.5)

## Why This Works

1. **Conditional Loading**: The settings.gradle checks if node_modules exists before trying to include the plugin
2. **No Version Specification**: The plugin version comes from the installed React Native version
3. **Build Hooks**: Ensure gradle evaluation succeeds even before npm install
4. **Local Plugin**: Uses `includeBuild` to load the plugin from node_modules instead of Maven

## Key Insights

1. **Don't specify plugin version**: Let it match your React Native version automatically
2. **Use includeBuild**: This is how modern React Native loads its gradle plugin
3. **Handle missing node_modules**: Essential for EAS builds
4. **Gradle 8.6 compatibility**: React Native 0.74.5 is tested with Gradle 8.6, not 8.7 or 8.8

## Build Command

```bash
eas build -p android --profile preview --clear-cache
```

## Expected Result

✅ Gradle finds the plugin in node_modules
✅ Build completes successfully
✅ APK is generated and available for download

## Troubleshooting

If the build still fails:
1. Check that `@react-native/gradle-plugin` exists in package-lock.json
2. Verify the EAS hooks are executable (`chmod +x *.sh`)
3. Ensure no version is specified in the gradle plugin classpath
4. Try `eas build --local` to debug locally first
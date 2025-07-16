# React Native 0.73.6 Known Issues and Android Build Requirements

## Overview
React Native 0.73.6 introduces significant changes to the Android build system, requiring updates to Java, Gradle, and the Android Gradle Plugin. This document outlines known issues, requirements, and workarounds for common build problems.

## Build Requirements

### Java Version
- **Required**: Java 17 (Breaking change from Java 11)
- **Installation**:
  ```bash
  brew tap homebrew/cask-versions
  brew install --cask zulu17
  ```
- Remember to update `JAVA_HOME` environment variable

### Gradle Versions
- **Gradle**: 8.3
- **Android Gradle Plugin (AGP)**: 8.x (Major update from 7.4.x)
- **Kotlin**: 1.7.10

### Android SDK Requirements
- **Compile SDK**: 34 (Android 14)
- **Target SDK**: 34
- **Min SDK**: 21 (Android 5.0 - last version to support it)
- **Build Tools**: 34.0.0
- **NDK**: 25.1.8937393

### Node.js
- **Minimum**: Node.js 18.x

## Major Breaking Changes

### 1. Namespace Migration (AGP 8.x)
All Android libraries must now specify a namespace in their `build.gradle` file:

```gradle
android {
    namespace = "com.example.mylibrary"
    // ...
}
```

Remove the package definition from `AndroidManifest.xml`.

### 2. Java 17 Requirement
Java 17 is now mandatory for building Android apps. This is one of the most significant changes affecting all developers.

### 3. Android 5.0 Deprecation
React Native 0.73 is the final version supporting Android 5.0 (API Level 21). Next version will require minimum SDK 23 (Android 6.0).

### 4. Remote JavaScript Debugging Removed
Remote JavaScript Debugging has been deprecated and removed from the Dev Menu. Use the NativeDevSettings API to enable remote debugging manually.

### 5. CLI Command Changes
- Default task prefix changed from `assemble` to `bundle` in `build-android` command
- `--variant` option removed, replaced with `--mode`

## Common Build Errors and Solutions

### 1. Namespace/Package Attribute Errors

**Error**: "Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported"

**Solution**: 
Add namespace to `android/build.gradle`:
```gradle
android {
    namespace = "com.yourapp"
    // ...
}
```

### 2. Third-Party Library Compatibility

**Issue**: Libraries not updated for AGP 8.x fail to build

**Workaround**: 
React Native 0.73 includes a compatibility layer, but you may need to add this to `android/build.gradle`:

```gradle
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            project.android {
                if (namespace == null) {
                    namespace project.group
                }
            }
        }
    }
}
```

### 3. Kotlin Version Conflicts

**Error**: "Class 'kotlin.~~~' was compiled with an incompatible version of kotlin"

**Solution**:
Force Kotlin version in `android/build.gradle`:
```gradle
ext {
    kotlinVersion = "1.7.10"
}
```

### 4. Build Variant Ambiguity

**Error**: "Cannot locate tasks that match 'app:installDebug' as task 'installDebug' is ambiguous"

**Solution**: 
Specify the exact build variant when running commands:
```bash
npx react-native run-android --mode=debug
```

### 5. Dependency Resolution Issues

**Solution**: 
Add exclusiveContent rule in `android/build.gradle`:
```gradle
allprojects {
    repositories {
        exclusiveContent {
            filter {
                includeGroup "com.facebook.react"
            }
            forRepository {
                maven {
                    url "$rootDir/../node_modules/react-native/android"
                }
            }
        }
    }
}
```

### 6. androidx.core Conflicts

**Solution**:
Add to `android/app/build.gradle`:
```gradle
configurations.all {
    resolutionStrategy {
        force 'androidx.core:core-ktx:1.6.0'
    }
}
```

## Known Library-Specific Issues

### React Native Reanimated
- Initial versions had namespace compatibility issues
- Update to latest version (3.x) for React Native 0.73 support

### React Native Firebase
- Ensure all Firebase packages are updated to versions supporting AGP 8.x
- May require manual namespace addition for older versions

### React Native Config
- Compatibility issues with Android productFlavors
- Update to latest version or apply namespace workarounds

## General Troubleshooting Steps

1. **Clean Build**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   rm -rf android/build
   rm -rf android/app/build
   ```

2. **Clear Caches**:
   ```bash
   npx react-native start --reset-cache
   cd android && ./gradlew clean
   ```

3. **Verify Java Version**:
   ```bash
   java -version  # Should show Java 17
   ```

4. **Update Dependencies**:
   ```bash
   npm update
   cd ios && pod update
   ```

## Migration Checklist

- [ ] Update Java to version 17
- [ ] Update `android/gradle/wrapper/gradle-wrapper.properties` to Gradle 8.3
- [ ] Update AGP to 8.x in `android/build.gradle`
- [ ] Add namespace to `android/app/build.gradle`
- [ ] Remove package from `AndroidManifest.xml`
- [ ] Update all third-party libraries to versions supporting React Native 0.73
- [ ] Update Node.js to version 18.x or higher
- [ ] Test build with `npx react-native run-android`
- [ ] Address any library-specific namespace issues

## Additional Resources

- [React Native 0.73 Release Blog](https://reactnative.dev/blog/2023/12/06/0.73-debugging-improvements-stable-symlinks)
- [Android Gradle Plugin 8.0 Migration Guide](https://developer.android.com/studio/releases/gradle-plugin#8-0-0)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [React Native Community Discussions](https://github.com/react-native-community/discussions-and-proposals/issues/671)

## Notes

- React Native 0.73 introduces experimental Bridgeless Mode
- Kotlin is now the recommended language for Android development
- The updated `metro.config.js` format from 0.72 is now required
- New permission `READ_MEDIA_VISUAL_USER_SELECTED` for Android 14 selected photos access
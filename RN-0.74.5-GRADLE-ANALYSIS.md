# React Native 0.74.5 Gradle Plugin Deep Analysis

## Executive Summary

Build #10 was failing due to fundamental misunderstandings about how React Native 0.74.x handles its Gradle plugin. Unlike older versions, RN 0.74.x does NOT publish its Gradle plugin to Maven Central - it only exists in node_modules.

## Key Findings

### 1. Gradle Plugin Distribution Model Change

**Old Way (RN < 0.73):**
- Plugin published to Maven Central
- Added via classpath: `classpath("com.facebook.react:react-native-gradle-plugin:$version")`
- Applied via: `apply plugin: "com.facebook.react.rootproject"`

**New Way (RN 0.74.x):**
- Plugin ONLY exists in node_modules at `@react-native/gradle-plugin`
- Added via pluginManagement: `includeBuild("../node_modules/@react-native/gradle-plugin")`
- Applied via: `plugins { id("com.facebook.react.settings") }`

### 2. Root Cause of Build Failures

1. **Version Mismatch:** package-lock.json had RN dependencies at 0.74.87 while package.json specified 0.74.5
2. **Wrong Plugin Configuration:** Trying to add plugin to classpath when it only exists in node_modules
3. **Timing Issue:** EAS was evaluating Gradle before node_modules existed

### 3. Critical Configuration Files

#### android/settings.gradle (MUST be first file Gradle reads)
```gradle
// This MUST handle missing node_modules gracefully
pluginManagement {
    includeBuild("../node_modules/@react-native/gradle-plugin")
}
plugins {
    id("com.facebook.react.settings")
}
```

#### android/build.gradle
```gradle
// DO NOT include React Native gradle plugin in classpath
// DO NOT apply rootproject plugin
```

### 4. EAS Build Process Understanding

1. **Gradle Sync Phase:** Happens BEFORE npm install
   - settings.gradle is evaluated
   - build.gradle files are parsed
   - Plugin resolution occurs

2. **npm Install Phase:** Installs dependencies including RN gradle plugin

3. **Build Phase:** Actually compiles the app

The key insight: settings.gradle MUST handle both scenarios (with and without node_modules).

## Solution Implementation

1. **Conditional settings.gradle:** Checks if node_modules exists before trying to include plugins
2. **Removed classpath dependency:** No longer trying to resolve from Maven
3. **Removed rootproject plugin:** Using the new settings plugin approach
4. **Fixed version mismatch:** Deleted package-lock.json to force regeneration

## Verification Steps

After applying fixes:
```bash
# 1. Regenerate package-lock.json with correct versions
npm install

# 2. Verify no version mismatches
grep "@react-native.*0.74" package-lock.json | grep -v "0.74.5" || echo "✓ All RN deps at 0.74.5"

# 3. Submit new build
eas build -p android --profile preview --clear-cache
```

## Why This Matters

React Native's move away from Maven Central for the Gradle plugin is part of their effort to:
- Ensure plugin version always matches RN version exactly
- Reduce dependency on external repositories
- Simplify the plugin distribution model
- Enable faster iteration on build tooling

## Lessons Learned

1. Always check if gradle plugins are published or local
2. React Native 0.74.x requires a different mental model for Gradle configuration
3. EAS build environment requires defensive coding in Gradle files
4. Version mismatches in package-lock.json can cause cascade failures

## References

- [React Native 0.74 Upgrade Guide](https://react-native-community.github.io/upgrade-helper/?from=0.73.0&to=0.74.5)
- [React Native Gradle Plugin Source](https://github.com/facebook/react-native/tree/main/packages/react-native-gradle-plugin)
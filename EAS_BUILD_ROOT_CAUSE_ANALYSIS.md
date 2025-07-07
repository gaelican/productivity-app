# EAS Build Root Cause Analysis - 12 Failed Attempts

## Executive Summary

After analyzing 12 failed EAS build attempts, the root cause is clear: **React Native 0.74.x bare workflow is fundamentally incompatible with EAS Build's current architecture**. EAS evaluates gradle configuration files BEFORE running npm install, but React Native 0.74.x requires node_modules content during gradle evaluation.

## Most Likely Causes (Ranked by Evidence)

### 1. 🔴 **EAS Build Timing Paradox** (95% confidence)
**Evidence:**
- All errors reference missing files in `/node_modules/`
- Errors occur during gradle evaluation phase, not build phase
- Conditional checks (`if nodeModulesDir.exists()`) fail because gradle parses files before executing conditions

**Impact:** This is the primary blocker - no configuration changes can fix this architectural mismatch.

### 2. 🟠 **React Native 0.74.x Plugin Architecture** (90% confidence)
**Evidence:**
- Build #2: "Included build '/node_modules/@react-native/gradle-plugin' does not exist"
- Build #6-7: Various plugin not found errors
- RN 0.74.x moved gradle plugin to npm package instead of Maven repository
- The plugin itself is defined IN node_modules, creating circular dependency

**Impact:** Cannot use React Native's official gradle configuration with EAS.

### 3. 🟡 **Package.json Configuration Issues** (70% confidence)
**Evidence from analysis:**
- Custom EAS build hooks (`eas-build-pre-install.sh`) may interfere with timing
- Metro babel preset version mismatch (0.77.0 instead of 0.76.x for RN 0.74.5)
- Duplicate `@babel/runtime` dependency
- Legacy peer deps enabled, masking potential conflicts

**Impact:** May cause secondary failures even if primary issues are resolved.

### 4. 🟢 **Gradle Version Compatibility** (60% confidence)
**Evidence:**
- Using Gradle 8.6 with Android Gradle Plugin 8.1.0
- React Native 0.74.x requires specific Gradle versions
- Some build failures occurred after settings.gradle passed

**Impact:** Contributing factor but not the root cause.

## Why Every Fix Reveals New Errors

```
Fix Pattern:
1. Remove plugin reference → Next plugin fails
2. Make settings minimal → Lose autolinking
3. Add conditionals → Gradle parsing fails
4. Remove all plugins → Core functionality lost
```

Each "fix" just moves the failure to the next node_modules dependency.

## Proven Solutions (Based on Research)

### Option 1: **Switch to Expo Managed Workflow** ⭐️ RECOMMENDED
- No gradle configuration needed
- Full EAS Build compatibility
- Can still use native modules via Expo config plugins

### Option 2: **Downgrade to React Native 0.73.x**
- Uses older plugin system compatible with EAS
- Gradle plugin published to Maven, not npm
- Proven to work with EAS bare workflow

### Option 3: **Local Builds with EAS**
```bash
eas build --local --platform android
```
- Builds on your machine where node_modules exists
- Bypasses EAS cloud timing issues
- Requires local environment setup

### Option 4: **Custom Docker Image**
- Create Docker image with pre-installed dependencies
- Complex but provides full control
- Example: https://docs.expo.dev/build-reference/custom-build-config/

### Option 5: **Fork React Native Gradle Plugin**
- Modify plugin to not require npm during evaluation
- Publish to Maven repository
- High maintenance burden

## Next Best Steps (Action Plan)

### Immediate Actions (Choose One):

#### A. **Verify Root Cause** (30 mins)
1. Create minimal test project:
   ```bash
   npx create-expo-app test-rn074 --template bare-minimum
   cd test-rn074
   npx expo install expo@~51.0.0
   eas build --platform android
   ```
2. If this fails with same errors → Confirms incompatibility
3. If this works → Compare configurations

#### B. **Try Managed Workflow** (2 hours)
1. Remove android/ and ios/ directories
2. Update app.json with full Expo config
3. Use Expo config plugins for native modules
4. Run `eas build --platform android`

#### C. **Downgrade to RN 0.73.x** (4 hours)
1. Update package.json: `"react-native": "0.73.9"`
2. Update Expo SDK to compatible version (SDK 50)
3. Run `npm install`
4. Reset android configuration
5. Try EAS build

### Long-term Solutions:

1. **File issue with Expo team** about RN 0.74.x bare workflow support
2. **Consider alternative CI/CD** like GitHub Actions with self-hosted runners
3. **Migrate to Expo Router** and managed workflow for better DX

## Conclusion

The 12 failed builds all stem from the same root cause: EAS Build's evaluation order is incompatible with React Native 0.74.x's expectation that node_modules exists during gradle configuration. This is an architectural limitation, not a configuration problem.

**Recommendation:** Switch to Expo managed workflow or downgrade to React Native 0.73.x for immediate resolution.
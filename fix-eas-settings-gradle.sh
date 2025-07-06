#!/bin/bash

echo "=== EAS Build Settings.gradle Fix ==="
echo ""
echo "This script provides the correct settings.gradle for EAS builds."
echo ""

# Create a backup of the current settings.gradle
if [ -f "android/settings.gradle" ]; then
    cp android/settings.gradle android/settings.gradle.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ Backed up current settings.gradle"
fi

# Show the current gradle version
echo ""
echo "Current Gradle configuration:"
grep "distributionUrl" android/gradle/wrapper/gradle-wrapper.properties || echo "gradle-wrapper.properties not found"

# Create the fixed settings.gradle
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'

// EAS Build Compatible Configuration
// This handles the different directory structures between local and EAS environments

def isEasBuild = System.getenv("EAS_BUILD") == "true"
println "[Settings] EAS Build: ${isEasBuild}"
println "[Settings] Root Dir: ${rootDir.absolutePath}"
println "[Settings] Parent Dir: ${rootDir.parentFile.absolutePath}"

// Method 1: Try to detect node_modules in various locations
def findNodeModules = {
    def possiblePaths = [
        new File(rootDir.parentFile, 'node_modules'),
        new File(rootDir, '../node_modules'),
        new File(rootDir.parentFile.parentFile, 'node_modules')
    ]
    
    def found = possiblePaths.find { it.exists() && it.isDirectory() }
    if (found) {
        println "[Settings] Found node_modules at: ${found.absolutePath}"
    }
    return found
}

def nodeModulesDir = findNodeModules()

// Method 2: Use Gradle's file() method which handles paths better
def loadExpoScripts = {
    try {
        // This method works better in EAS because file() is relative to the build root
        apply from: file("../node_modules/expo/scripts/autolinking.gradle")
        useExpoModules()
        println "[Settings] ✓ Loaded Expo autolinking"
        return true
    } catch (Exception e) {
        println "[Settings] ✗ Could not load Expo autolinking: ${e.message}"
        return false
    }
}

def loadReactNativeScripts = {
    try {
        apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
        applyNativeModulesSettingsGradle(settings)
        println "[Settings] ✓ Loaded React Native CLI scripts"
        return true
    } catch (Exception e) {
        println "[Settings] ✗ Could not load RN CLI scripts: ${e.message}"
        return false
    }
}

// Try loading scripts
def expoLoaded = false
def rnLoaded = false

// First try using detected node_modules path
if (nodeModulesDir != null) {
    def expoScript = new File(nodeModulesDir, 'expo/scripts/autolinking.gradle')
    def rnScript = new File(nodeModulesDir, '@react-native-community/cli-platform-android/native_modules.gradle')
    
    if (expoScript.exists()) {
        apply from: expoScript
        useExpoModules()
        expoLoaded = true
        println "[Settings] ✓ Loaded Expo from detected path"
    }
    
    if (rnScript.exists()) {
        apply from: rnScript
        applyNativeModulesSettingsGradle(settings)
        rnLoaded = true
        println "[Settings] ✓ Loaded RN from detected path"
    }
}

// If not loaded yet, try the file() method
if (!expoLoaded) {
    expoLoaded = loadExpoScripts()
}

if (!rnLoaded) {
    rnLoaded = loadReactNativeScripts()
}

// Final status
println "[Settings] Configuration complete - Expo: ${expoLoaded}, RN: ${rnLoaded}"

include ':app'
EOF

echo ""
echo "✓ Created EAS-compatible settings.gradle"
echo ""
echo "The new settings.gradle:"
echo "- Detects EAS build environment"
echo "- Tries multiple methods to find node_modules"
echo "- Provides debug output to help diagnose issues"
echo "- Handles both local and EAS directory structures"
echo ""
echo "Next steps:"
echo "1. Commit this change: git add android/settings.gradle && git commit -m 'Fix EAS build settings.gradle'"
echo "2. Push to your repository"
echo "3. Run: eas build -p android --profile preview --clear-cache"
echo ""
echo "The build logs will now show debug information to help diagnose any remaining issues."
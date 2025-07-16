#!/bin/bash

# Solution K: Fix Autolinking Issue
# This script properly removes AsyncStorage after React Native autolinking

echo "=== Applying Solution K: Fix Autolinking Issue ==="
echo "This solution modifies settings.gradle to remove AsyncStorage after autolinking"
echo ""

# First apply Solution A (Gradle version fix)
echo "Step 1: Applying Gradle version fix..."
if [ -f "scripts/apply-solution-a.sh" ]; then
    bash scripts/apply-solution-a.sh
else
    echo "Warning: Solution A script not found, skipping Gradle fix"
fi

echo ""
echo "Step 2: Creating fixed settings.gradle..."

# Create a new settings.gradle that removes AsyncStorage after autolinking
cat > android/settings.gradle << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = 'ProductivityApp'

// Include app module first
include ':app'

def nodeModulesDir = new File(rootDir.parentFile, 'node_modules')

if (nodeModulesDir.exists()) {
    println "[SETTINGS] node_modules found, applying autolinking..."
    
    // Apply React Native CLI autolinking
    def cliPlatformAndroid = new File(nodeModulesDir, '@react-native-community/cli-platform-android/native_modules.gradle')
    if (cliPlatformAndroid.exists()) {
        println "[SETTINGS] Applying React Native CLI autolinking..."
        apply from: cliPlatformAndroid
        applyNativeModulesSettingsGradle(settings)
    }
    
    // Apply Expo autolinking
    def expoAutolinking = new File(nodeModulesDir, 'expo/scripts/autolinking.gradle')
    if (expoAutolinking.exists()) {
        println "[SETTINGS] Applying Expo autolinking..."
        apply from: expoAutolinking
        useExpoModules()
    }
    
    // CRITICAL: Remove AsyncStorage projects after autolinking
    println "[SETTINGS] Post-autolinking cleanup..."
    def projectsToRemove = []
    settings.gradle.includeFlat.each { projectPath ->
        if (projectPath.toString().toLowerCase().contains('async-storage') ||
            projectPath.toString().contains('asyncstorage')) {
            projectsToRemove.add(projectPath)
        }
    }
    
    // Also check the standard projects map
    def projectNamesToRemove = []
    settings.gradle.rootProject.children.each { project ->
        if (project.name.toLowerCase().contains('async-storage') ||
            project.name.toLowerCase().contains('asyncstorage')) {
            projectNamesToRemove.add(project.name)
        }
    }
    
    // Remove AsyncStorage projects
    projectsToRemove.each { projectPath ->
        println "[SETTINGS] Removing project: ${projectPath}"
        settings.gradle.includeFlat.remove(projectPath)
    }
    
    projectNamesToRemove.each { projectName ->
        println "[SETTINGS] Removing project by name: ${projectName}"
        def projectToRemove = settings.gradle.rootProject.children.find { it.name == projectName }
        if (projectToRemove) {
            settings.gradle.rootProject.children.remove(projectToRemove)
        }
    }
} else {
    println "[SETTINGS] node_modules not found, skipping autolinking"
}

// Post-process to ensure AsyncStorage is removed
gradle.settingsEvaluated {
    def allProjects = [] as Set
    
    // Collect all project names
    settings.gradle.rootProject.children.each { project ->
        allProjects.add(project.name)
    }
    
    println "[SETTINGS] All projects after autolinking: ${allProjects}"
    
    // Remove any AsyncStorage related projects
    def toRemove = allProjects.findAll { name ->
        name.toLowerCase().contains('async-storage') || 
        name.toLowerCase().contains('asyncstorage')
    }
    
    toRemove.each { projectName ->
        println "[SETTINGS] Late removal of project: ${projectName}"
        def project = settings.gradle.rootProject.children.find { it.name == projectName }
        if (project) {
            settings.gradle.rootProject.children.remove(project)
        }
    }
    
    println "[SETTINGS] Final project count: ${settings.gradle.rootProject.children.size()}"
}
EOF

echo "✓ Created fixed settings.gradle"

# Also update app/build.gradle to handle missing AsyncStorage dependency
echo ""
echo "Step 3: Updating app/build.gradle to handle missing AsyncStorage..."

# Read current app/build.gradle
APP_BUILD_GRADLE="android/app/build.gradle"

# Create a backup
cp "$APP_BUILD_GRADLE" "$APP_BUILD_GRADLE.backup"

# Add configuration to handle missing projects
cat > android/app-async-storage-fix.gradle << 'EOF'
// Fix for AsyncStorage missing project
android {
    // Ensure packaging options are set
    packagingOptions {
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/NOTICE.txt'
        pickFirst '**/*.so'
    }
}

// Configure dependencies to exclude AsyncStorage
configurations.all {
    exclude group: 'com.reactnativecommunity', module: 'async-storage'
    exclude group: '@react-native-async-storage', module: 'async-storage'
    
    resolutionStrategy {
        // Force exclude AsyncStorage
        eachDependency { details ->
            if (details.requested.name.contains('async-storage') || 
                details.requested.group.contains('async-storage')) {
                details.useTarget = null
            }
        }
    }
}

// Remove AsyncStorage from React Native autolinking if it exists
project.afterEvaluate {
    // Check if react.gradle added AsyncStorage
    def hasAsyncStorage = false
    try {
        project(':react-native-async-storage_async-storage')
        hasAsyncStorage = true
    } catch (UnknownProjectException e) {
        // AsyncStorage project doesn't exist, which is what we want
    }
    
    if (hasAsyncStorage) {
        println "[APP] WARNING: AsyncStorage project found, attempting to remove dependency"
        // Remove from dependencies
        configurations.all { config ->
            config.dependencies.removeIf { dep ->
                dep.name?.contains('async-storage') || dep.group?.contains('async-storage')
            }
        }
    }
}
EOF

# Apply the fix to app/build.gradle if not already applied
if ! grep -q "app-async-storage-fix.gradle" "$APP_BUILD_GRADLE"; then
    echo "" >> "$APP_BUILD_GRADLE"
    echo "// Apply AsyncStorage fix" >> "$APP_BUILD_GRADLE"
    echo "apply from: 'app-async-storage-fix.gradle'" >> "$APP_BUILD_GRADLE"
    echo "✓ Applied AsyncStorage fix to app/build.gradle"
else
    echo "✓ AsyncStorage fix already applied to app/build.gradle"
fi

# Create a custom React Native config to exclude AsyncStorage
echo ""
echo "Step 4: Creating React Native config to exclude AsyncStorage..."

cat > react-native.config.js << 'EOF'
module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: null, // Disable Android platform
        ios: null,     // Disable iOS platform
      },
    },
    '@react-native-community/async-storage': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
EOF

echo "✓ Created react-native.config.js"

# Clean and rebuild
echo ""
echo "Step 5: Cleaning build directories..."
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle
rm -rf node_modules/.cache
echo "✓ Cleaned build directories"

echo ""
echo "===================="
echo "Solution K Applied!"
echo "===================="
echo ""
echo "This solution:"
echo "1. Updates Gradle to 8.3 (from Solution A)"
echo "2. Modifies settings.gradle to remove AsyncStorage after autolinking"
echo "3. Updates app/build.gradle to handle missing AsyncStorage gracefully"
echo "4. Creates react-native.config.js to disable AsyncStorage autolinking"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: cd android && ./gradlew clean assembleDebug"
echo ""
echo "This is a comprehensive fix that addresses the root cause:"
echo "AsyncStorage being added by React Native autolinking after our exclusions."
#!/bin/bash

# Solution C: Resolution Strategy
# This script modifies android/build.gradle to add strict dependency exclusions
# and force resolution rules to handle version conflicts

echo "=== Applying Solution C: Resolution Strategy ==="

BUILD_GRADLE="android/build.gradle"

if [ ! -f "$BUILD_GRADLE" ]; then
    echo "✗ android/build.gradle not found!"
    exit 1
fi

# Backup original file
cp "$BUILD_GRADLE" "${BUILD_GRADLE}.backup"

# Create resolution strategy configuration
cat > android/resolution-strategy.gradle << 'EOF'
// Resolution strategy to handle dependency conflicts
allprojects {
    configurations.all {
        resolutionStrategy {
            // Force specific versions
            force 'com.facebook.react:react-native:0.73.0'
            force 'com.facebook.react:hermes-android:0.73.0'
            
            // Exclude problematic transitive dependencies
            exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
            
            // Fail on version conflicts
            failOnVersionConflict()
            
            // Cache dynamic versions for 10 minutes
            cacheDynamicVersionsFor 10, 'minutes'
            
            // Don't cache changing modules
            cacheChangingModulesFor 0, 'seconds'
        }
    }
    
    // Apply to all subprojects
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            android {
                configurations.all {
                    resolutionStrategy {
                        eachDependency { details ->
                            // Handle AsyncStorage specifically
                            if (details.requested.group == 'com.reactnativecommunity' && 
                                details.requested.name == 'asyncstorage') {
                                details.useTarget group: 'com.facebook.react', 
                                               name: 'react-native', 
                                               version: '0.73.0'
                            }
                        }
                    }
                }
            }
        }
    }
}

// Exclude AsyncStorage from all configurations
subprojects {
    afterEvaluate { project ->
        configurations.all {
            exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
            exclude group: '@react-native-async-storage', module: 'async-storage'
        }
    }
}
EOF

# Check if resolution strategy is already applied
if ! grep -q "resolution-strategy.gradle" "$BUILD_GRADLE"; then
    # Add apply statement after buildscript block
    awk '/^buildscript {/{p=1} p&&/^}/{p=0; print; print "\n// Apply resolution strategy\napply from: \"resolution-strategy.gradle\"\n"; next} 1' "$BUILD_GRADLE" > "$BUILD_GRADLE.tmp"
    mv "$BUILD_GRADLE.tmp" "$BUILD_GRADLE"
    echo "✓ Added resolution strategy to build.gradle"
else
    echo "✓ Resolution strategy already applied"
fi

# Also update app/build.gradle to exclude AsyncStorage
APP_BUILD_GRADLE="android/app/build.gradle"
if [ -f "$APP_BUILD_GRADLE" ]; then
    cp "$APP_BUILD_GRADLE" "${APP_BUILD_GRADLE}.backup"
    
    # Add exclusions to dependencies block if not already present
    if ! grep -q "exclude group: 'com.reactnativecommunity'" "$APP_BUILD_GRADLE"; then
        cat > android/app-exclusions.gradle << 'EOF'

// Exclude AsyncStorage from all dependencies
configurations.all {
    exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
    exclude group: '@react-native-async-storage', module: 'async-storage'
}

dependencies {
    implementation("com.facebook.react:react-android") {
        exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
    }
    
    implementation("com.facebook.react:hermes-android") {
        exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
    }
}
EOF
        
        # Apply exclusions
        echo "" >> "$APP_BUILD_GRADLE"
        echo "apply from: '../app-exclusions.gradle'" >> "$APP_BUILD_GRADLE"
        echo "✓ Added exclusions to app/build.gradle"
    fi
fi

echo "✓ Solution C applied successfully!"
echo "Next steps:"
echo "1. Clean the project: cd android && ./gradlew clean"
echo "2. Rebuild: npm run android"
echo ""
echo "Note: This adds strict version resolution and excludes AsyncStorage dependencies."
#!/bin/bash
# Fix React Native 0.74.5 Gradle Configuration

echo "Fixing React Native 0.74.5 Gradle configuration..."

# Step 1: Remove the incorrect classpath and plugin application
echo "1. Cleaning android/build.gradle..."
sed -i '/classpath("com.facebook.react:react-native-gradle-plugin")/d' android/build.gradle
sed -i '/apply plugin: "com.facebook.react.rootproject"/d' android/build.gradle

# Step 2: Fix package-lock.json version mismatch
echo "2. Removing package-lock.json to force correct version resolution..."
rm -f package-lock.json

# Step 3: Update settings.gradle to handle missing node_modules gracefully
echo "3. Creating conditional settings.gradle..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'

// Check if node_modules exists (for EAS compatibility)
def nodeModulesDir = new File(rootDir, '../node_modules')
def reactNativeGradlePlugin = new File(rootDir, '../node_modules/@react-native/gradle-plugin')

if (nodeModulesDir.exists() && reactNativeGradlePlugin.exists()) {
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
    
    // Apply Expo autolinking if available
    def expoAutolinkingScript = new File(rootDir, '../node_modules/expo/scripts/autolinking.gradle')
    if (expoAutolinkingScript.exists()) {
        apply from: expoAutolinkingScript
        useExpoModules()
    }
    
    // Apply React Native CLI platform Android native modules
    def nativeModulesScript = new File(rootDir, '../node_modules/@react-native-community/cli-platform-android/native_modules.gradle')
    if (nativeModulesScript.exists()) {
        apply from: nativeModulesScript
        applyNativeModulesSettingsGradle(settings)
    }
} else {
    // Minimal configuration when node_modules doesn't exist yet
    println("Warning: node_modules not found. Using minimal configuration.")
    println("This is expected during the initial gradle sync in EAS build.")
}

include ':app'
EOF

# Step 4: Update EAS hooks to ensure they're executable
echo "4. Making EAS hooks executable..."
chmod +x eas-build-pre-install.sh
chmod +x eas-build-post-install.sh

# Step 5: Add EAS hooks configuration to eas.json
echo "5. Updating eas.json with build hooks..."
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 3.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": false,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "image": "latest"
      },
      "hooks": {
        "eas": {
          "build": {
            "onStart": {
              "commands": [
                {
                  "command": "./eas-build-pre-install.sh",
                  "cwd": "."
                }
              ]
            },
            "onComplete": {
              "commands": [
                {
                  "command": "./eas-build-post-install.sh", 
                  "cwd": "."
                }
              ]
            }
          }
        }
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# Step 6: Create a more robust pre-install hook
echo "6. Updating pre-install hook..."
cat > eas-build-pre-install.sh << 'EOF'
#!/bin/bash
# EAS pre-install hook for React Native 0.74.5

echo "Running EAS pre-install hook for RN 0.74.5..."

# The settings.gradle already handles missing node_modules
# So we don't need to modify it here

echo "Pre-install hook completed"
EOF

# Step 7: Update post-install hook
echo "7. Updating post-install hook..."
cat > eas-build-post-install.sh << 'EOF'
#!/bin/bash
# EAS post-install hook for React Native 0.74.5

echo "Running EAS post-install hook..."

# Verify gradle plugin exists
if [ -d node_modules/@react-native/gradle-plugin ]; then
    echo "✓ React Native gradle plugin found in node_modules"
else
    echo "✗ React Native gradle plugin NOT found in node_modules!"
    echo "  This will cause build failures."
    exit 1
fi

# Verify React Native version matches
RN_VERSION=$(grep '"react-native":' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
echo "React Native version: $RN_VERSION"

if [ "$RN_VERSION" != "0.74.5" ]; then
    echo "Warning: Expected React Native 0.74.5 but found $RN_VERSION"
fi

echo "Post-install hook completed"
EOF

echo ""
echo "✅ All fixes applied!"
echo ""
echo "Summary of changes:"
echo "1. Removed incorrect gradle plugin classpath from android/build.gradle"
echo "2. Removed incorrect rootproject plugin application" 
echo "3. Updated settings.gradle to properly handle RN 0.74.5 plugin loading"
echo "4. Removed package-lock.json to fix version mismatch"
echo "5. Updated EAS hooks for better compatibility"
echo ""
echo "Next steps:"
echo "1. Run: npm install (to regenerate package-lock.json with correct versions)"
echo "2. Run: eas build -p android --profile preview --clear-cache"
echo ""
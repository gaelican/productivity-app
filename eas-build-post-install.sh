#!/bin/bash
# EAS post-install hook to restore full gradle configuration

echo "Running EAS post-install hook..."

# Restore the full settings.gradle after npm install
if [ -f android/settings.gradle.original ]; then
    mv android/settings.gradle.original android/settings.gradle
fi

# Verify gradle plugin exists
if [ -d node_modules/@react-native/gradle-plugin ]; then
    echo "✓ React Native gradle plugin found in node_modules"
else
    echo "✗ React Native gradle plugin NOT found in node_modules!"
    echo "  This may cause build failures."
fi

echo "Post-install hook completed"

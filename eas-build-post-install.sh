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

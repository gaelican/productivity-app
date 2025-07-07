#!/bin/bash
# EAS pre-install hook to ensure gradle configuration is correct

echo "Running EAS pre-install hook..."

# Create a temporary settings.gradle that doesn't depend on node_modules
if [ ! -f android/settings.gradle.original ]; then
    cp android/settings.gradle android/settings.gradle.original
fi

# Use minimal settings for initial gradle evaluation
cat > android/settings.gradle << 'SETTINGS'
rootProject.name = 'ProductivityApp'
include ':app'
SETTINGS

echo "Pre-install hook completed"

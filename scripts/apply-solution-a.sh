#!/bin/bash

# Solution A: Gradle Version Fix
# This script updates the Gradle wrapper to version 8.3 and clears caches
# to resolve compatibility issues with React Native 0.73

echo "=== Applying Solution A: Gradle Version Fix ==="
echo "Updating Gradle wrapper to version 8.3..."

# Update gradle-wrapper.properties
GRADLE_WRAPPER_FILE="android/gradle/wrapper/gradle-wrapper.properties"
if [ -f "$GRADLE_WRAPPER_FILE" ]; then
    # Backup original file
    cp "$GRADLE_WRAPPER_FILE" "${GRADLE_WRAPPER_FILE}.backup"
    
    # Update to Gradle 8.3
    sed -i 's|distributionUrl=.*|distributionUrl=https\\://services.gradle.org/distributions/gradle-8.3-all.zip|' "$GRADLE_WRAPPER_FILE"
    echo "✓ Updated Gradle wrapper to 8.3"
else
    echo "✗ gradle-wrapper.properties not found!"
    exit 1
fi

# Clear Gradle caches
echo "Clearing Gradle caches..."
cd android || exit 1

# Clean build directories
rm -rf build/
rm -rf app/build/
rm -rf .gradle/

# Also clear user gradle cache (be careful with this in production)
if [ -d ~/.gradle/caches ]; then
    echo "Clearing user Gradle cache..."
    rm -rf ~/.gradle/caches/
fi

# Run gradle wrapper to download new version
echo "Downloading Gradle 8.3..."
./gradlew --version

echo "✓ Solution A applied successfully!"
echo "Next steps:"
echo "1. Run 'cd android && ./gradlew clean'"
echo "2. Try building again with 'npm run android'"
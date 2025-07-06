#!/bin/bash

echo "=== EAS Build Configuration Verification ==="
echo ""

# Check if required files exist
echo "Checking required files..."
required_files=(
    "android/build.gradle"
    "android/settings.gradle"
    "android/gradle.properties"
    "android/app/build.gradle"
    "app.json"
    "eas.json"
    "package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing!"
    fi
done

echo ""
echo "Checking Gradle plugin versions..."
# Check for version numbers in build.gradle
if grep -q "gradle:[0-9]" android/build.gradle; then
    echo "✓ Android Gradle plugin has version"
else
    echo "✗ Android Gradle plugin missing version!"
fi

if grep -q "react-native-gradle-plugin:[0-9]" android/build.gradle; then
    echo "✓ React Native Gradle plugin has version"
else
    echo "✗ React Native Gradle plugin missing version!"
fi

echo ""
echo "Checking package.json dependencies..."
if grep -q "@react-native/gradle-plugin" package.json; then
    echo "✓ React Native Gradle plugin in dependencies"
else
    echo "✗ React Native Gradle plugin missing from dependencies!"
fi

echo ""
echo "Checking app configuration..."
# Extract package name from different files
manifest_package=$(grep -oP 'package="\K[^"]+' android/app/src/main/AndroidManifest.xml 2>/dev/null || echo "not found")
gradle_package=$(grep -oP 'namespace "\K[^"]+' android/app/build.gradle 2>/dev/null || echo "not found")
app_json_package=$(grep -oP '"package": "\K[^"]+' app.json 2>/dev/null || echo "not found")

echo "Package names:"
echo "  AndroidManifest.xml: $manifest_package"
echo "  build.gradle: $gradle_package"
echo "  app.json: $app_json_package"

if [ "$gradle_package" = "$app_json_package" ]; then
    echo "✓ Package names match"
else
    echo "✗ Package name mismatch!"
fi

echo ""
echo "=== Summary ==="
echo "Run 'eas build -p android --profile preview' to start the build"
echo "Use './check-eas-build.sh' to monitor build status"
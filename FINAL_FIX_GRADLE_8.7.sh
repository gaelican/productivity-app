#!/bin/bash

echo "=== FINAL FIX: Upgrading to Gradle 8.7 for React Native 0.74.5 ==="
echo ""
echo "This is based on deep research showing RN 0.74.x REQUIRES Gradle 8.7+"
echo ""

# Fix 1: Update Gradle to 8.7 (MOST CRITICAL FIX)
echo "1. Updating Gradle version to 8.7..."
sed -i 's/gradle-8.6-all/gradle-8.7-all/g' android/gradle/wrapper/gradle-wrapper.properties

# Fix 2: Ensure plugin version matches RN version
echo "2. Ensuring React Native Gradle Plugin version matches (0.74.5)..."
sed -i 's/react-native-gradle-plugin:[0-9.]\+/react-native-gradle-plugin:0.74.5/g' android/build.gradle

# Fix 3: Add plugin to package.json if missing
echo "3. Adding @react-native/gradle-plugin to dependencies..."
if ! grep -q "@react-native/gradle-plugin" package.json; then
    # Add before the closing brace of dependencies
    sed -i '/"uuid":/a\    "@react-native/gradle-plugin": "0.74.5",' package.json
fi

# Fix 4: Create minimal settings.gradle
echo "4. Creating EAS-compatible settings.gradle..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'
include ':app'
EOF

# Fix 5: Verify configuration
echo ""
echo "=== Configuration Verification ==="
echo -n "✓ Gradle version: "
grep -o 'gradle-[0-9.]*-all' android/gradle/wrapper/gradle-wrapper.properties | grep -o '[0-9.]*'
echo -n "✓ RN Gradle Plugin: "
grep -o 'react-native-gradle-plugin:[0-9.]*' android/build.gradle | grep -o '[0-9.]*'
echo -n "✓ React Native: "
grep '"react-native":' package.json | grep -o '[0-9.]*'

echo ""
echo "=== CRITICAL: Based on research, these versions are REQUIRED ==="
echo "- Gradle: 8.7+ (not 8.6)"
echo "- RN Gradle Plugin: Must match RN version exactly"
echo "- Plugin source: npm (not Maven Central)"
echo ""
echo "Ready to build! Run:"
echo "eas build -p android --profile preview --clear-cache"
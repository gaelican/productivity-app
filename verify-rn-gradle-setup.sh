#!/bin/bash
# Verify React Native 0.74.5 Gradle Setup

echo "=== React Native 0.74.5 Gradle Configuration Verification ==="
echo ""

# Check 1: React Native version
echo "1. Checking React Native version..."
RN_VERSION=$(grep '"react-native":' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
if [ "$RN_VERSION" = "0.74.5" ]; then
    echo "   ✅ React Native version: $RN_VERSION"
else
    echo "   ❌ React Native version mismatch: $RN_VERSION (expected 0.74.5)"
fi

# Check 2: No classpath dependency
echo ""
echo "2. Checking android/build.gradle..."
if grep -q "react-native-gradle-plugin" android/build.gradle; then
    echo "   ❌ Found react-native-gradle-plugin in classpath (should be removed)"
else
    echo "   ✅ No react-native-gradle-plugin in classpath"
fi

if grep -q "rootproject" android/build.gradle; then
    echo "   ❌ Found rootproject plugin application (should be removed)"
else
    echo "   ✅ No rootproject plugin application"
fi

# Check 3: Settings.gradle structure
echo ""
echo "3. Checking android/settings.gradle..."
if grep -q "pluginManagement" android/settings.gradle; then
    echo "   ✅ Found pluginManagement block"
else
    echo "   ❌ Missing pluginManagement block"
fi

if grep -q "nodeModulesDir.exists()" android/settings.gradle; then
    echo "   ✅ Has conditional check for node_modules"
else
    echo "   ❌ Missing conditional check for node_modules"  
fi

# Check 4: Gradle version
echo ""
echo "4. Checking Gradle version..."
GRADLE_VERSION=$(grep "distributionUrl" android/gradle/wrapper/gradle-wrapper.properties | grep -o '[0-9]\+\.[0-9]\+')
if [ "$GRADLE_VERSION" = "8.6" ]; then
    echo "   ✅ Gradle version: $GRADLE_VERSION"
else
    echo "   ❌ Gradle version: $GRADLE_VERSION (expected 8.6)"
fi

# Check 5: EAS hooks
echo ""
echo "5. Checking EAS build hooks..."
if [ -x "eas-build-pre-install.sh" ]; then
    echo "   ✅ pre-install hook is executable"
else
    echo "   ❌ pre-install hook not found or not executable"
fi

if [ -x "eas-build-post-install.sh" ]; then
    echo "   ✅ post-install hook is executable"
else
    echo "   ❌ post-install hook not found or not executable"
fi

# Check 6: Package name consistency
echo ""
echo "6. Checking package name consistency..."
APP_JSON_PACKAGE=$(grep '"package":' app.json | grep -o 'com\.[^"]*' | head -1)
BUILD_GRADLE_PACKAGE=$(grep 'applicationId' android/app/build.gradle | grep -o 'com\.[^"]*' | head -1)

if [ "$APP_JSON_PACKAGE" = "$BUILD_GRADLE_PACKAGE" ]; then
    echo "   ✅ Package names match: $APP_JSON_PACKAGE"
else
    echo "   ❌ Package name mismatch:"
    echo "      app.json: $APP_JSON_PACKAGE"
    echo "      build.gradle: $BUILD_GRADLE_PACKAGE"
fi

# Check 7: Node modules (if exists)
echo ""
echo "7. Checking node_modules (if present)..."
if [ -d "node_modules" ]; then
    if [ -d "node_modules/@react-native/gradle-plugin" ]; then
        echo "   ✅ React Native gradle plugin found in node_modules"
    else
        echo "   ❌ React Native gradle plugin NOT found in node_modules"
    fi
else
    echo "   ℹ️  node_modules not present (run npm install)"
fi

# Summary
echo ""
echo "=== Summary ==="
echo ""
echo "If all checks pass, you're ready to build:"
echo "1. npm install (if not done)"
echo "2. eas build -p android --profile preview --clear-cache"
echo ""
echo "If any checks fail, run: ./fix-rn-0.74.5-gradle.sh"
echo ""
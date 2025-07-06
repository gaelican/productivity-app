#!/bin/bash

echo "=== Fixing EAS Build Autolinking Issue ==="
echo ""
echo "This script applies the definitive fix for the 'Could not read script' error"
echo ""

# 1. Fix settings.gradle with dynamic path resolution
echo "1. Updating settings.gradle with dynamic path resolution..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'

apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle");
useExpoModules()

apply from: new File(["node", "--print", "require.resolve('@react-native-community/cli-platform-android/package.json')"].execute(null, rootDir).text.trim(), "../native_modules.gradle");
applyNativeModulesSettingsGradle(settings)

include ':app'
EOF

# 2. Ensure gradle wrapper uses compatible version
echo "2. Setting Gradle to version 8.6 (compatible with RN 0.74.5)..."
sed -i 's/gradle-8.8-all/gradle-8.6-all/g' android/gradle/wrapper/gradle-wrapper.properties

# 3. Fix React Native gradle plugin version
echo "3. Fixing React Native gradle plugin version to match RN version..."
if grep -q "react-native-gradle-plugin:0.74.87" android/build.gradle; then
    sed -i 's/react-native-gradle-plugin:0.74.87/react-native-gradle-plugin:0.74.5/g' android/build.gradle
    echo "   - Updated gradle plugin version from 0.74.87 to 0.74.5"
fi

# 4. Ensure package name consistency
echo "4. Checking package name consistency..."
PACKAGE_NAME=$(grep '"package":' app.json | cut -d'"' -f4)
if [ "$PACKAGE_NAME" = "com.productivityapp.app" ]; then
    echo "   - Fixing package name from com.productivityapp.app to com.productivityapp"
    sed -i 's/"package": "com.productivityapp.app"/"package": "com.productivityapp"/g' app.json
fi

# 5. Verify all fixes
echo ""
echo "=== Verification ==="
echo -n "Settings.gradle uses dynamic resolution: "
if grep -q "require.resolve('expo/package.json')" android/settings.gradle; then
    echo "✓"
else
    echo "✗"
fi

echo -n "Gradle version is 8.6: "
if grep -q "gradle-8.6-all" android/gradle/wrapper/gradle-wrapper.properties; then
    echo "✓"
else
    echo "✗"
fi

echo -n "RN gradle plugin version matches: "
RN_VERSION=$(grep '"react-native":' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
PLUGIN_VERSION=$(grep 'react-native-gradle-plugin:' android/build.gradle | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
if [ "$RN_VERSION" = "$PLUGIN_VERSION" ]; then
    echo "✓ ($RN_VERSION)"
else
    echo "✗ (RN: $RN_VERSION, Plugin: $PLUGIN_VERSION)"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Commit these changes:"
echo "   git add android/settings.gradle android/gradle/wrapper/gradle-wrapper.properties"
echo "   git commit -m 'Fix EAS autolinking with dynamic path resolution'"
echo ""
echo "2. Submit a new build with cache cleared:"
echo "   eas build -p android --profile preview --clear-cache"
echo ""
echo "This fix uses Node.js to dynamically resolve module paths, which works"
echo "reliably in both local and EAS build environments."
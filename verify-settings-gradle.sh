#!/bin/bash

echo "Verifying settings.gradle configuration..."
echo "========================================="

# Check if settings.gradle exists
if [ ! -f "android/settings.gradle" ]; then
    echo "❌ android/settings.gradle not found!"
    exit 1
fi

echo "✅ android/settings.gradle exists"

# Display the content
echo -e "\nCurrent settings.gradle content:"
echo "--------------------------------"
cat android/settings.gradle

# Check for required patterns
echo -e "\n\nChecking required patterns:"
echo "--------------------------------"

if grep -q "rootProject.name = 'ProductivityApp'" android/settings.gradle; then
    echo "✅ Root project name is set correctly"
else
    echo "❌ Root project name is missing or incorrect"
fi

if grep -q "apply from: file(\"../node_modules/expo/scripts/autolinking.gradle\")" android/settings.gradle; then
    echo "✅ Expo autolinking is configured"
else
    echo "❌ Expo autolinking is missing"
fi

if grep -q "useExpoModules()" android/settings.gradle; then
    echo "✅ useExpoModules() is called"
else
    echo "❌ useExpoModules() call is missing"
fi

if grep -q "apply from: file(\"../node_modules/@react-native-community/cli-platform-android/native_modules.gradle\")" android/settings.gradle; then
    echo "✅ React Native modules gradle is applied"
else
    echo "❌ React Native modules gradle is missing"
fi

if grep -q "applyNativeModulesSettingsGradle(settings)" android/settings.gradle; then
    echo "✅ Native modules settings are applied"
else
    echo "❌ Native modules settings application is missing"
fi

if grep -q "include ':app'" android/settings.gradle; then
    echo "✅ App module is included"
else
    echo "❌ App module include is missing"
fi

if grep -q "includeBuild('../node_modules/@react-native/gradle-plugin')" android/settings.gradle; then
    echo "✅ React Native gradle plugin is included"
else
    echo "❌ React Native gradle plugin include is missing"
fi

echo -e "\n\nConfiguration summary:"
echo "======================"
echo "This settings.gradle uses simple relative paths without Node.js resolution."
echo "This is the most reliable approach for EAS builds as it doesn't depend on"
echo "Node.js command execution during the Gradle configuration phase."
echo ""
echo "The configuration includes:"
echo "1. Expo autolinking for native modules"
echo "2. React Native CLI platform Android native modules"
echo "3. React Native gradle plugin (for RN 0.73+)"
echo ""
echo "This should work reliably in EAS Build environments."
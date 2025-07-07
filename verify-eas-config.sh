#!/bin/bash
# Verify EAS configuration is correct

echo "🔍 Verifying EAS Configuration"
echo "=============================="

# Check settings.gradle
echo ""
echo "1. Checking settings.gradle..."
if grep -q "node_modules" android/settings.gradle; then
    echo "   ❌ Found node_modules reference in settings.gradle!"
else
    echo "   ✅ settings.gradle is clean"
fi

# Check build.gradle buildscript
echo ""
echo "2. Checking build.gradle buildscript..."
if grep -A 10 "buildscript" android/build.gradle | grep -q "node_modules"; then
    echo "   ❌ Found node_modules reference in buildscript!"
else
    echo "   ✅ buildscript is clean"
fi

# Check for rootproject plugin
echo ""
echo "3. Checking for rootproject plugin..."
if grep -q "com.facebook.react.rootproject" android/build.gradle; then
    echo "   ❌ Found rootproject plugin!"
else
    echo "   ✅ No rootproject plugin"
fi

# Check app/build.gradle
echo ""
echo "4. Checking app/build.gradle..."
if tail -10 android/app/build.gradle | grep -q "native_modules.gradle"; then
    echo "   ✅ native_modules.gradle found at end"
else
    echo "   ❌ native_modules.gradle missing!"
fi

if tail -10 android/app/build.gradle | grep -q "expo_modules.gradle"; then
    echo "   ✅ expo_modules.gradle found at end"
else
    echo "   ❌ expo_modules.gradle missing!"
fi

# Check package.json
echo ""
echo "5. Checking package.json..."
if grep -q '"expo"' package.json; then
    echo "   ✅ expo found in dependencies"
else
    echo "   ❌ expo missing from dependencies!"
fi

echo ""
echo "=============================="
echo "Configuration check complete!"
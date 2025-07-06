#!/bin/bash

echo "=== Fixing All Known Build Issues ==="
echo ""

# Fix 1: React Native gradle plugin version mismatch
echo "1. Fixing React Native gradle plugin version (0.74.87 → 0.74.5)..."
sed -i 's/react-native-gradle-plugin:0.74.87/react-native-gradle-plugin:0.74.5/g' android/build.gradle
sed -i 's/"@react-native\/gradle-plugin": "0.74.87"/"@react-native\/gradle-plugin": "0.74.5"/g' package.json

# Fix 2: Simplify settings.gradle to avoid node_modules dependency
echo "2. Creating minimal settings.gradle..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'
include ':app'
EOF

# Fix 3: Downgrade Gradle version for compatibility
echo "3. Setting Gradle version to 8.6 (from 8.8)..."
sed -i 's/gradle-8.8-all/gradle-8.6-all/g' android/gradle/wrapper/gradle-wrapper.properties

# Fix 4: Fix package name consistency
echo "4. Ensuring consistent package name (com.productivityapp)..."
sed -i 's/"package": "com.productivityapp.app"/"package": "com.productivityapp"/g' app.json

# Fix 5: Ensure all required repositories are present
echo "5. Adding missing Maven repositories..."
if ! grep -q "maven { url \"https://www.jitpack.io\" }" android/build.gradle; then
    # Add jitpack repository after mavenCentral()
    sed -i '/mavenCentral()/a\        maven { url "https://www.jitpack.io" }' android/build.gradle
fi

# Fix 6: Ensure React Native repo is in allprojects
echo "6. Ensuring React Native Maven repository..."
if ! grep -q "node_modules/react-native/android" android/build.gradle; then
    sed -i '/allprojects {/,/^}/ {
        /repositories {/a\
        maven {\
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm\
            url("$rootDir/../node_modules/react-native/android")\
        }
    }' android/build.gradle
fi

echo ""
echo "=== Verification ==="
echo -n "React Native version: "
grep '"react-native":' package.json | grep -o '[0-9.]*'
echo -n "Gradle plugin version: "
grep 'react-native-gradle-plugin:' android/build.gradle | grep -o '[0-9.]*'
echo -n "Gradle wrapper version: "
grep 'distributionUrl' android/gradle/wrapper/gradle-wrapper.properties | grep -o '[0-9.]*'
echo -n "Package name in app.json: "
grep '"package":' app.json | cut -d'"' -f4

echo ""
echo "=== All fixes applied! ==="
echo ""
echo "Next steps:"
echo "1. Run: eas build -p android --profile preview --clear-cache"
echo "2. Monitor build at: https://expo.dev/accounts/[your-username]/projects/productivity-app/builds"
echo "3. If build fails, share the build URL (not logs) for quick debugging"
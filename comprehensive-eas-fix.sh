#!/bin/bash
# comprehensive-eas-fix.sh

echo "=== Comprehensive EAS Build Fix ==="

# 1. Fix plugin versions
echo "1. Fixing React Native Gradle Plugin version..."
sed -i 's/react-native-gradle-plugin:[0-9.]\+/react-native-gradle-plugin:0.74.5/g' android/build.gradle

# 2. Create conditional settings.gradle
echo "2. Creating conditional settings.gradle..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'

// Conditional node_modules access for EAS compatibility
def nodeModulesDir = new File(rootDir, '../node_modules')
if (nodeModulesDir.exists()) {
    apply from: new File(nodeModulesDir, 'expo/scripts/autolinking.gradle')
    useExpoModules()
    
    apply from: new File(nodeModulesDir, '@react-native-community/cli-platform-android/native_modules.gradle')
    applyNativeModulesSettingsGradle(settings)
}

include ':app'
EOF

# 3. Clean gradle.properties
echo "3. Cleaning gradle.properties..."
# Remove Java home hardcoding
sed -i '/org.gradle.java.home=/d' android/gradle.properties
# Remove duplicate architectures (keep first occurrence)
awk '!seen[$0]++' android/gradle.properties > android/gradle.properties.tmp && mv android/gradle.properties.tmp android/gradle.properties

# 4. Ensure Gradle 8.7
echo "4. Setting Gradle to 8.7..."
sed -i 's/gradle-[0-9.]*-all/gradle-8.7-all/g' android/gradle/wrapper/gradle-wrapper.properties

# 5. Fix package.json
echo "5. Adding missing dependencies..."
if ! grep -q "metro-react-native-babel-preset" package.json; then
    sed -i '/"@react-native\/gradle-plugin":/a\    "metro-react-native-babel-preset": "0.77.0",' package.json
fi

# 6. Update EAS config
echo "6. Updating eas.json..."
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 3.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": false,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "image": "latest"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

echo ""
echo "=== All fixes applied! ==="
echo "Run: eas build -p android --profile preview --clear-cache"
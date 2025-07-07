#!/bin/bash
# Fix Expo Android configuration for EAS builds

echo "🔧 Fixing Expo Android Configuration for EAS"
echo "==========================================="

# 1. Ensure minimal settings.gradle
echo "1. Setting minimal settings.gradle..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'
include ':app'
EOF

# 2. Add Expo to root build.gradle
echo "2. Adding Expo to root build.gradle..."
# Check if expo is already in buildscript
if ! grep -q "expo-module-plugin" android/build.gradle; then
    # Add to buildscript dependencies
    sed -i '/dependencies {/a\        classpath("org.expo:expo-module-plugin")' android/build.gradle
fi

# 3. Remove the problematic apply from line at the bottom of app/build.gradle
echo "3. Fixing app/build.gradle..."
# Remove the line that tries to apply from node_modules
sed -i '/apply from: file("..\/..\/node_modules\/@react-native-community\/cli-platform-android\/native_modules.gradle")/d' android/app/build.gradle

# 4. Add Expo's gradle plugin configuration
echo "4. Creating expo-module.plugin.js..."
cat > expo-module.plugin.js << 'EOF'
module.exports = {
  android: {
    compileSdkVersion: 34,
    targetSdkVersion: 34,
    buildToolsVersion: "34.0.0"
  }
};
EOF

# 5. Ensure package.json has expo
echo "5. Checking expo in package.json..."
if ! grep -q '"expo"' package.json; then
    echo "   ⚠️  'expo' not found in package.json"
    echo "   Adding expo to dependencies..."
    # This is a bit hacky but works for adding expo
    sed -i '/"react-native-web":/a\    "expo": "~51.0.0",' package.json
fi

# 6. Create a proper metro.config.js if it doesn't exist
if [ ! -f metro.config.js ]; then
    echo "6. Creating metro.config.js..."
    cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
EOF
fi

# 7. Ensure babel config is correct
echo "7. Checking babel.config.js..."
if [ ! -f babel.config.js ]; then
    cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
EOF
fi

echo ""
echo "✅ Expo Android configuration fixed!"
echo ""
echo "Summary of changes:"
echo "- Minimal settings.gradle (no node_modules references)"
echo "- Added expo-module-plugin to buildscript"
echo "- Removed problematic native_modules.gradle reference"
echo "- Ensured expo is in package.json"
echo "- Created proper config files"
echo ""
echo "Next steps:"
echo "1. Commit: git add -A && git commit -m 'Fix Expo Android configuration for EAS'"
echo "2. Build: eas build -p android --profile preview --clear-cache"
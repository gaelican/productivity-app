#!/bin/bash
# Analyze EAS build errors and apply fixes

echo "🔍 EAS Build Error Analysis and Auto-Fix"
echo "========================================"

# First, let's check the most recent failed build
echo "Getting latest build status..."
BUILD_INFO=$(eas build:list --platform android --limit 5 --non-interactive 2>&1)

echo "$BUILD_INFO" | grep -E "(errored|failed)" -B 2 -A 2

# Common fixes based on frequent EAS errors
echo ""
echo "🔧 Applying common EAS build fixes..."

# Fix 1: Expo config issue
echo ""
echo "1. Fixing expo config issue..."
if ! grep -q '"expo"' package.json; then
    echo "   Adding expo to package.json..."
    sed -i '/"dependencies": {/a\    "expo": "~51.0.0",' package.json
fi

# Fix 2: Settings.gradle - ensure it's minimal
echo ""
echo "2. Ensuring minimal settings.gradle..."
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')

// Apply scripts after project evaluation
gradle.projectsEvaluated {
    apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
    useExpoModules()
    
    apply from: new File(["node", "--print", "require.resolve('@react-native-community/cli-platform-android/package.json')"].execute(null, rootDir).text.trim(), "../native_modules.gradle")
    applyNativeModulesSettingsGradle(settings)
}
EOF

# Fix 3: Ensure babel config exists
echo ""
echo "3. Checking babel config..."
if [ ! -f babel.config.js ]; then
    echo "   Creating babel.config.js..."
    cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
EOF
fi

# Fix 4: Clean gradle properties
echo ""
echo "4. Cleaning gradle.properties..."
# Remove problematic entries
sed -i '/org.gradle.java.home=/d' android/gradle.properties 2>/dev/null

# Fix 5: Ensure metro config
echo ""
echo "5. Checking metro config..."
if [ ! -f metro.config.js ]; then
    echo "   Creating metro.config.js..."
    cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
EOF
fi

echo ""
echo "✅ Common fixes applied!"
echo ""
echo "📋 Next steps:"
echo "1. Review the logs at: https://expo.dev/accounts/gaelican/projects/productivity-app/builds/"
echo "2. Commit the fixes: git add -A && git commit -m 'Fix EAS build configuration'"
echo "3. Run new build: eas build -p android --profile preview --clear-cache"
echo ""
echo "If the build still fails, paste the error logs here for specific analysis."
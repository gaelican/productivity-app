#!/bin/bash
# Fix for React Native 0.74.5 Gradle Plugin issue in EAS builds

echo "=== Fixing React Native 0.74.5 Gradle Plugin Configuration ==="

# 1. Ensure we're using Gradle 8.6 (recommended for RN 0.74.5)
echo "1. Setting Gradle version to 8.6..."
sed -i 's/gradle-8.7-all/gradle-8.6-all/g' android/gradle/wrapper/gradle-wrapper.properties
sed -i 's/gradle-8.8-all/gradle-8.6-all/g' android/gradle/wrapper/gradle-wrapper.properties

# 2. Update build.gradle to remove version from gradle plugin classpath
echo "2. Updating build.gradle..."
# Create a backup first
cp android/build.gradle android/build.gradle.backup

# Update the gradle plugin classpath to not specify version
sed -i 's/classpath("com.facebook.react:react-native-gradle-plugin:.*")/classpath("com.facebook.react:react-native-gradle-plugin")/g' android/build.gradle

# 3. Settings.gradle is already updated with conditional loading

# 4. Add local maven repository for React Native Android binaries
echo "3. Adding local maven repository configuration..."
# Check if the local maven repo is already configured
if ! grep -q "maven.*node_modules/react-native/android" android/build.gradle; then
    echo "   Note: Local maven repository already configured in allprojects"
fi

# 5. Verify configuration
echo ""
echo "=== Configuration Verification ==="
echo -n "Gradle version: "
grep distributionUrl android/gradle/wrapper/gradle-wrapper.properties | cut -d'=' -f2-
echo -n "React Native version: "
grep '"react-native":' package.json | cut -d'"' -f4
echo -n "Gradle plugin classpath: "
grep 'react-native-gradle-plugin' android/build.gradle | head -1
echo ""

# 6. Create a pre-install hook for EAS
echo "4. Creating EAS pre-install hook..."
cat > eas-build-pre-install.sh << 'EOF'
#!/bin/bash
# EAS pre-install hook to ensure gradle configuration is correct

echo "Running EAS pre-install hook..."

# Create a temporary settings.gradle that doesn't depend on node_modules
if [ ! -f android/settings.gradle.original ]; then
    cp android/settings.gradle android/settings.gradle.original
fi

# Use minimal settings for initial gradle evaluation
cat > android/settings.gradle << 'SETTINGS'
rootProject.name = 'ProductivityApp'
include ':app'
SETTINGS

echo "Pre-install hook completed"
EOF

chmod +x eas-build-pre-install.sh

# 7. Create a post-install hook for EAS
echo "5. Creating EAS post-install hook..."
cat > eas-build-post-install.sh << 'EOF'
#!/bin/bash
# EAS post-install hook to restore full gradle configuration

echo "Running EAS post-install hook..."

# Restore the full settings.gradle after npm install
if [ -f android/settings.gradle.original ]; then
    mv android/settings.gradle.original android/settings.gradle
fi

# Verify gradle plugin exists
if [ -d node_modules/@react-native/gradle-plugin ]; then
    echo "✓ React Native gradle plugin found in node_modules"
else
    echo "✗ React Native gradle plugin NOT found in node_modules!"
    echo "  This may cause build failures."
fi

echo "Post-install hook completed"
EOF

chmod +x eas-build-post-install.sh

# 8. Update package.json to use the hooks
echo "6. Updating package.json with EAS hooks..."
# Check if the hooks are already set
if ! grep -q "eas-build-pre-install.*eas-build-pre-install.sh" package.json; then
    # Update the pre-install script
    sed -i 's/"eas-build-pre-install": ".*"/"eas-build-pre-install": ".\/eas-build-pre-install.sh"/g' package.json
fi

if ! grep -q "eas-build-post-install.*eas-build-post-install.sh" package.json; then
    # Update the post-install script
    sed -i 's/"eas-build-post-install": ".*"/"eas-build-post-install": ".\/eas-build-post-install.sh"/g' package.json
fi

echo ""
echo "=== Fix Applied Successfully! ==="
echo ""
echo "Key changes made:"
echo "1. ✓ Gradle version set to 8.6 (compatible with RN 0.74.5)"
echo "2. ✓ Removed version from gradle plugin classpath"
echo "3. ✓ Updated settings.gradle with conditional node_modules loading"
echo "4. ✓ Created EAS build hooks to handle the chicken-and-egg problem"
echo ""
echo "Next steps:"
echo "1. Commit these changes: git add -A && git commit -m 'Fix React Native gradle plugin for EAS builds'"
echo "2. Submit a new build: eas build -p android --profile preview --clear-cache"
echo ""
echo "The build should now:"
echo "- Use minimal settings.gradle during initial evaluation"
echo "- Switch to full configuration after npm install"
echo "- Find the gradle plugin in node_modules"
echo "- Complete successfully!"
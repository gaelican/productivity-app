#!/bin/bash

# Solution E: Manual Resolution
# This script adds explicit excludes to each dependency and patches package.json

echo "=== Applying Solution E: Manual Resolution ==="

# Function to patch package.json
patch_package_json() {
    local PACKAGE_JSON="package.json"
    
    if [ ! -f "$PACKAGE_JSON" ]; then
        echo "✗ package.json not found!"
        return 1
    fi
    
    # Backup package.json
    cp "$PACKAGE_JSON" "${PACKAGE_JSON}.backup"
    
    # Create a Node.js script to modify package.json
    cat > patch-package.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(process.cwd(), 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add resolutions for npm (overrides)
if (!package.overrides) {
    package.overrides = {};
}

// Force specific versions and exclude AsyncStorage
package.overrides = {
    ...package.overrides,
    "@react-native-async-storage/async-storage": "npm:@react-native/empty@*",
    "react-native": "0.73.0",
    "@react-native-community/async-storage": "npm:@react-native/empty@*"
};

// Add resolutions for yarn
if (!package.resolutions) {
    package.resolutions = {};
}

package.resolutions = {
    ...package.resolutions,
    "@react-native-async-storage/async-storage": "@react-native/empty@*",
    "react-native": "0.73.0",
    "@react-native-community/async-storage": "@react-native/empty@*"
};

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
console.log('✓ Updated package.json with dependency overrides');
EOF
    
    # Run the patch script
    node patch-package.js
    rm patch-package.js
}

# Function to add explicit excludes to android/app/build.gradle
add_explicit_excludes() {
    local APP_BUILD_GRADLE="android/app/build.gradle"
    
    if [ ! -f "$APP_BUILD_GRADLE" ]; then
        echo "✗ android/app/build.gradle not found!"
        return 1
    fi
    
    # Backup the file
    cp "$APP_BUILD_GRADLE" "${APP_BUILD_GRADLE}.backup"
    
    # Create a temporary gradle file with explicit excludes
    cat > android/app/explicit-excludes.gradle << 'EOF'
// Explicit excludes for each dependency
android {
    packagingOptions {
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/NOTICE.txt'
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    }
}

configurations.all {
    resolutionStrategy {
        force 'com.facebook.react:react-native:0.73.0'
    }
}

dependencies.all {
    // Explicitly exclude AsyncStorage from all dependencies
    implementation { transitive = false }
}

// Redefine dependencies with explicit excludes
dependencies {
    implementation("com.facebook.react:react-android:0.73.0") {
        exclude group: 'com.reactnativecommunity'
        exclude group: '@react-native-async-storage'
        exclude module: 'async-storage'
        exclude module: 'asyncstorage'
    }
    
    implementation("com.facebook.react:hermes-android:0.73.0") {
        exclude group: 'com.reactnativecommunity'
        exclude group: '@react-native-async-storage'
        exclude module: 'async-storage'
        exclude module: 'asyncstorage'
    }
    
    // For each autolinking dependency
    implementation(project(':react-native-screens')) {
        exclude group: 'com.reactnativecommunity'
        exclude group: '@react-native-async-storage'
    }
    
    implementation(project(':react-native-safe-area-context')) {
        exclude group: 'com.reactnativecommunity'
        exclude group: '@react-native-async-storage'
    }
    
    implementation(project(':react-native-gesture-handler')) {
        exclude group: 'com.reactnativecommunity'
        exclude group: '@react-native-async-storage'
    }
    
    implementation(project(':react-native-reanimated')) {
        exclude group: 'com.reactnativecommunity'
        exclude group: '@react-native-async-storage'
    }
}

// Apply excludes to all configurations
configurations {
    all {
        exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
        exclude group: '@react-native-async-storage', module: 'async-storage'
    }
}
EOF
    
    # Check if excludes already applied
    if ! grep -q "explicit-excludes.gradle" "$APP_BUILD_GRADLE"; then
        echo "" >> "$APP_BUILD_GRADLE"
        echo "apply from: 'explicit-excludes.gradle'" >> "$APP_BUILD_GRADLE"
        echo "✓ Added explicit excludes to app/build.gradle"
    fi
}

# Function to create metro.config.js with exclusions
create_metro_config() {
    cat > metro.config.js << 'EOF'
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    // Exclude AsyncStorage from bundling
    blacklistRE: /node_modules[/\\]@react-native-async-storage[/\\].*/,
    
    // Mock AsyncStorage imports
    extraNodeModules: {
      '@react-native-async-storage/async-storage': require.resolve('./mocks/async-storage-mock.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
EOF
    
    # Create mock directory
    mkdir -p mocks
    
    # Create AsyncStorage mock
    cat > mocks/async-storage-mock.js << 'EOF'
// Mock implementation of AsyncStorage
export default {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async (keys) => keys.map(key => [key, null]),
  multiSet: async () => {},
  multiRemove: async () => {},
};
EOF
    
    echo "✓ Created metro.config.js with AsyncStorage exclusions"
}

# Execute all steps
echo "1. Patching package.json..."
patch_package_json

echo ""
echo "2. Adding explicit excludes to Android build..."
add_explicit_excludes

echo ""
echo "3. Creating Metro configuration..."
create_metro_config

echo ""
echo "4. Creating postinstall script..."
cat > scripts/postinstall.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Running postinstall: Removing AsyncStorage dependencies...');

// Remove AsyncStorage from node_modules
const asyncStoragePaths = [
    'node_modules/@react-native-async-storage',
    'node_modules/@react-native-community/async-storage'
];

asyncStoragePaths.forEach(dir => {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ Removed ${dir}`);
    }
});

console.log('Postinstall complete!');
EOF

chmod +x scripts/postinstall.js

# Add postinstall to package.json if not present
if ! grep -q "postinstall" package.json; then
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts.postinstall = 'node scripts/postinstall.js';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('✓ Added postinstall script to package.json');
    "
fi

echo ""
echo "✓ Solution E applied successfully!"
echo ""
echo "Next steps:"
echo "1. Delete node_modules: rm -rf node_modules"
echo "2. Clean npm cache: npm cache clean --force"
echo "3. Install dependencies: npm install"
echo "4. Clean Android build: cd android && ./gradlew clean"
echo "5. Build the app: npm run android"
echo ""
echo "This solution adds explicit excludes to every dependency and"
echo "uses npm overrides/yarn resolutions to prevent AsyncStorage installation."
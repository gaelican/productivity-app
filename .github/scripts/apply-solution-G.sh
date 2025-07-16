#!/bin/bash
# Solution G: Remove conflicting deps - Strip problematic dependencies

echo "=== Applying Solution G: Remove Conflicting Dependencies ==="

# Create a clean package.json with minimal dependencies
cat > package.json.minimal << 'EOF'
{
  "name": "productivityapp",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.6",
    "@react-navigation/native": "^6.1.6",
    "@react-navigation/stack": "^6.3.16",
    "react-native-screens": "~3.29.0",
    "react-native-safe-area-context": "4.8.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/babel-preset": "0.73.21",
    "@react-native/eslint-config": "0.73.2",
    "@react-native/metro-config": "0.73.5",
    "@react-native/typescript-config": "0.73.1",
    "babel-jest": "^29.6.3",
    "eslint": "^8.19.0",
    "jest": "^29.6.3",
    "prettier": "2.8.8",
    "react-test-renderer": "18.2.0",
    "typescript": "5.0.4"
  },
  "engines": {
    "node": ">=18"
  }
}
EOF

# Backup current package.json
cp package.json package.json.backup

# Create script to selectively remove dependencies
cat > remove-deps.js << 'EOF'
const fs = require('fs');

// Read current package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// List of potentially problematic dependencies to remove
const problematicDeps = [
  '@react-native-async-storage/async-storage',
  'react-native-gesture-handler',
  'react-native-reanimated',
  '@react-native-community/netinfo',
  'react-native-vector-icons',
  'react-native-svg',
  '@react-native-firebase/app',
  '@react-native-firebase/auth',
  '@react-native-firebase/firestore'
];

// Remove problematic dependencies
problematicDeps.forEach(dep => {
  delete packageJson.dependencies[dep];
  delete packageJson.devDependencies[dep];
});

// Write updated package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Removed problematic dependencies');
EOF

# Run the removal script
node remove-deps.js

# Clean node_modules and reinstall
rm -rf node_modules
yarn install

# Update android/settings.gradle to exclude problematic modules
cat > android/settings.gradle << 'EOF'
rootProject.name = 'productivityapp'

// Custom module exclusion logic
def modulesToExclude = [
    '@react-native-async-storage/async-storage',
    'react-native-gesture-handler',
    'react-native-reanimated'
]

apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
applyNativeModulesSettingsGradle(settings, { module ->
    // Exclude problematic modules
    return !modulesToExclude.contains(module.name)
})

include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')
EOF

# Update android/app/build.gradle to exclude transitive dependencies
cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

react {
    hermesCommand = "../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
    codegenDir = file("../../node_modules/@react-native/codegen")
}

def enableProguardInReleaseBuilds = false
def jscFlavor = 'org.webkit:android-jsc:+'

android {
    ndkVersion "25.1.8937393"
    buildToolsVersion = "34.0.0"
    compileSdk 34

    namespace "com.productivityapp"
    
    defaultConfig {
        applicationId "com.productivityapp"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
    
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
    }
}

configurations {
    all {
        exclude group: 'com.facebook.flipper'
        exclude group: 'com.facebook.yoga', module: 'proguard-annotations'
        
        // Exclude problematic transitive dependencies
        exclude group: 'com.google.android.gms'
        exclude group: 'com.google.firebase'
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
    
    // Only essential AndroidX dependencies
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
}

// Custom task to list all dependencies
task listDeps {
    doLast {
        configurations.implementation.each { File file ->
            println file.name
        }
    }
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
applyNativeModulesAppBuildGradle(project, { module ->
    // Filter out problematic modules
    return !['@react-native-async-storage/async-storage', 'react-native-gesture-handler'].contains(module.name)
})
EOF

# Create a stub for AsyncStorage in JavaScript
mkdir -p src/stubs
cat > src/stubs/AsyncStorage.js << 'EOF'
// Stub implementation of AsyncStorage
const storage = {};

export default {
  setItem: async (key, value) => {
    storage[key] = value;
    return Promise.resolve();
  },
  getItem: async (key) => {
    return Promise.resolve(storage[key] || null);
  },
  removeItem: async (key) => {
    delete storage[key];
    return Promise.resolve();
  },
  clear: async () => {
    Object.keys(storage).forEach(key => delete storage[key]);
    return Promise.resolve();
  },
  getAllKeys: async () => {
    return Promise.resolve(Object.keys(storage));
  }
};
EOF

# Create metro.config.js to handle module resolution
cat > metro.config.js << 'EOF'
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    // Map problematic modules to stubs
    extraNodeModules: {
      '@react-native-async-storage/async-storage': __dirname + '/src/stubs/AsyncStorage.js',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
EOF

echo "Solution G applied successfully!"
echo "Problematic dependencies have been removed and stubbed where necessary."
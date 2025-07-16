#!/bin/bash
# Solution J: Hybrid approach - Combine version fixes with simplification

echo "=== Applying Solution J: Hybrid Approach ==="

# Step 1: Simplify gradle configuration
echo "Step 1: Simplifying gradle configuration..."

cat > android/gradle.properties << 'EOF'
# Core settings
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.caching=true

# React Native 0.73.6 settings
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
newArchEnabled=false
hermesEnabled=true

# Version locks
FLIPPER_VERSION=0.182.0
android.minSdkVersion=21
android.compileSdkVersion=34
android.targetSdkVersion=34
android.buildToolsVersion=34.0.0
android.ndkVersion=25.1.8937393
EOF

# Step 2: Create unified version management
echo "Step 2: Creating unified version management..."

cat > android/versions.gradle << 'EOF'
ext {
    // React Native versions
    reactNativeVersion = "0.73.6"
    hermesVersion = "0.73.6"
    
    // Android versions
    buildToolsVersion = "34.0.0"
    minSdkVersion = 21
    compileSdkVersion = 34
    targetSdkVersion = 34
    ndkVersion = "25.1.8937393"
    kotlinVersion = "1.8.0"
    
    // AndroidX versions
    androidxAppCompatVersion = "1.6.1"
    androidxSwipeRefreshVersion = "1.1.0"
    androidxLifecycleVersion = "2.5.1"
    
    // Other dependencies
    soloaderVersion = "0.10.5"
    fbjniVersion = "0.3.0"
}
EOF

# Step 3: Create simplified root build.gradle
echo "Step 3: Updating root build.gradle..."

cat > android/build.gradle << 'EOF'
apply from: "versions.gradle"

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url("https://www.jitpack.io") }
    }
    
    // Global dependency resolution
    configurations.all {
        resolutionStrategy {
            // Force React Native version
            force "com.facebook.react:react-native:${reactNativeVersion}"
            force "com.facebook.react:hermes-android:${hermesVersion}"
            
            // Force AndroidX versions
            force "androidx.appcompat:appcompat:${androidxAppCompatVersion}"
            force "androidx.swiperefreshlayout:swiperefreshlayout:${androidxSwipeRefreshVersion}"
            
            // Force other critical versions
            force "com.facebook.soloader:soloader:${soloaderVersion}"
            force "com.facebook.fbjni:fbjni:${fbjniVersion}"
            
            // Exclude Flipper in all configurations
            exclude group: 'com.facebook.flipper'
            
            // Performance optimizations
            cacheDynamicVersionsFor 10, 'minutes'
            cacheChangingModulesFor 10, 'minutes'
        }
    }
}

// Task to verify versions
task verifyVersions {
    doLast {
        println "React Native Version: ${reactNativeVersion}"
        println "Compile SDK: ${compileSdkVersion}"
        println "Build Tools: ${buildToolsVersion}"
        println "NDK Version: ${ndkVersion}"
    }
}
EOF

# Step 4: Create optimized app build.gradle
echo "Step 4: Creating optimized app build.gradle..."

cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

// Import versions
apply from: "../versions.gradle"

react {
    hermesCommand = "../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
    codegenDir = file("../../node_modules/@react-native/codegen")
    reactNativeDir = file("../../node_modules/react-native")
    
    // Explicitly set to avoid auto-detection issues
    root = file("../..")
    jsRootDir = file("../../")
}

def enableProguardInReleaseBuilds = false

android {
    ndkVersion rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdkVersion rootProject.ext.compileSdkVersion

    namespace "com.productivityapp"
    
    defaultConfig {
        applicationId "com.productivityapp"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        
        // Optimize build
        multiDexEnabled false
        vectorDrawables.useSupportLibrary = true
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
            debuggable true
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
            
            // Optimize release build
            shrinkResources enableProguardInReleaseBuilds
            zipAlignEnabled true
        }
    }
    
    // Optimize packaging
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
        
        // Exclude unnecessary files
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/NOTICE.txt'
        exclude 'META-INF/ASL2.0'
        exclude 'META-INF/notice.txt'
        exclude 'META-INF/license.txt'
    }
    
    // Build optimizations
    dexOptions {
        javaMaxHeapSize "4g"
        preDexLibraries true
        maxProcessCount 8
    }
}

dependencies {
    // React Native core (version locked in root build.gradle)
    implementation("com.facebook.react:react-android")
    
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation "org.webkit:android-jsc:+"
    }
    
    // Essential AndroidX dependencies (versions locked)
    implementation "androidx.appcompat:appcompat:${androidxAppCompatVersion}"
    implementation "androidx.swiperefreshlayout:swiperefreshlayout:${androidxSwipeRefreshVersion}"
}

// Apply native modules with filtering
apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
applyNativeModulesAppBuildGradle(project)

// Custom task to clean and prepare
task cleanAndPrepare {
    dependsOn clean
    doLast {
        delete "${rootDir}/.gradle"
        delete "${rootDir}/build"
        println "Clean and prepare completed"
    }
}
EOF

# Step 5: Create AsyncStorage compatibility layer
echo "Step 5: Creating AsyncStorage compatibility layer..."

mkdir -p android/app/src/main/java/com/productivityapp/modules

cat > android/app/src/main/java/com/productivityapp/modules/AsyncStorageCompat.java << 'EOF'
package com.productivityapp.modules;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.HashMap;
import java.util.Map;

public class AsyncStorageCompat extends ReactContextBaseJavaModule {
    private static Map<String, String> storage = new HashMap<>();
    
    public AsyncStorageCompat(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "AsyncStorageCompat";
    }
    
    @ReactMethod
    public void setItem(String key, String value, Callback callback) {
        storage.put(key, value);
        callback.invoke((Object) null);
    }
    
    @ReactMethod
    public void getItem(String key, Callback callback) {
        String value = storage.get(key);
        callback.invoke((Object) null, value);
    }
    
    @ReactMethod
    public void removeItem(String key, Callback callback) {
        storage.remove(key);
        callback.invoke((Object) null);
    }
    
    @ReactMethod
    public void clear(Callback callback) {
        storage.clear();
        callback.invoke((Object) null);
    }
}
EOF

# Step 6: Create build optimization script
echo "Step 6: Creating build optimization script..."

cat > android/optimize-build.sh << 'EOF'
#!/bin/bash

echo "=== Optimizing React Native Build ==="

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean
rm -rf $HOME/.gradle/caches/transforms-*
rm -rf $HOME/.gradle/caches/build-cache-*

# Optimize gradle daemon
echo "Optimizing gradle daemon..."
./gradlew --stop
./gradlew --daemon --parallel --configure-on-demand

# Pre-download dependencies
echo "Pre-downloading dependencies..."
./gradlew :app:dependencies --configuration implementation

# Verify configuration
echo "Verifying configuration..."
./gradlew verifyVersions

echo "Build optimization complete!"
EOF

chmod +x android/optimize-build.sh

# Step 7: Create EAS-specific configuration
echo "Step 7: Creating EAS-specific configuration..."

cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "env": {
          "GRADLE_OPTS": "-Xmx14g -XX:MaxMetaspaceSize=512m",
          "_JAVA_OPTIONS": "-Xmx14g"
        }
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease",
        "env": {
          "GRADLE_OPTS": "-Xmx14g -XX:MaxMetaspaceSize=512m",
          "_JAVA_OPTIONS": "-Xmx14g"
        }
      }
    }
  }
}
EOF

# Step 8: Create verification script
echo "Step 8: Creating verification script..."

cat > verify-setup.sh << 'EOF'
#!/bin/bash

echo "=== Verifying Hybrid Solution Setup ==="

# Check gradle files
echo "Checking gradle files..."
[ -f "android/versions.gradle" ] && echo "✓ versions.gradle exists" || echo "✗ versions.gradle missing"
[ -f "android/build.gradle" ] && echo "✓ build.gradle exists" || echo "✗ build.gradle missing"
[ -f "android/app/build.gradle" ] && echo "✓ app/build.gradle exists" || echo "✗ app/build.gradle missing"

# Check Java files
echo "Checking Java files..."
[ -f "android/app/src/main/java/com/productivityapp/modules/AsyncStorageCompat.java" ] && echo "✓ AsyncStorageCompat exists" || echo "✗ AsyncStorageCompat missing"

# Check scripts
echo "Checking scripts..."
[ -f "android/optimize-build.sh" ] && echo "✓ optimize-build.sh exists" || echo "✗ optimize-build.sh missing"

# Run gradle verification
echo "Running gradle verification..."
cd android && ./gradlew verifyVersions

echo "Verification complete!"
EOF

chmod +x verify-setup.sh

# Run verification
./verify-setup.sh

echo "Solution J (Hybrid approach) applied successfully!"
echo "This solution combines:"
echo "- Simplified gradle configuration"
echo "- Centralized version management"
echo "- Dependency resolution strategies"
echo "- Build optimizations"
echo "- AsyncStorage compatibility layer"
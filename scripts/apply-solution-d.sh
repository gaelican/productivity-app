#!/bin/bash

# Solution D: Clean Template (Simplified)
# This script resets key configuration files to a clean state
# and removes complex customizations that might cause issues

echo "=== Applying Solution D: Clean Template ==="

# Function to create clean build.gradle
create_clean_build_gradle() {
    cat > android/build.gradle << 'EOF'
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "26.1.10909125"
        kotlinVersion = "1.9.22"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
        classpath("com.facebook.react:react-native-gradle-plugin")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}

apply plugin: "com.facebook.react.rootproject"
EOF
}

# Function to create clean app/build.gradle
create_clean_app_build_gradle() {
    cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

android {
    namespace "com.productivityapp"
    compileSdkVersion rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.productivityapp"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
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
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}

apply from: file("../../node_modules/react-native/react.gradle")
EOF
}

# Function to create clean settings.gradle
create_clean_settings_gradle() {
    cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'
include ':app'

apply from: file("../node_modules/react-native/react-native.gradle")
EOF
}

# Function to create clean gradle.properties
create_clean_gradle_properties() {
    cat > android/gradle.properties << 'EOF'
# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true

# Android properties
android.useAndroidX=true
android.enableJetifier=true

# React Native properties
newArchEnabled=false
hermesEnabled=true

# Version of flipper to use
FLIPPER_VERSION=0.182.0
EOF
}

# Backup existing files
echo "Backing up existing configuration files..."
for file in android/build.gradle android/app/build.gradle android/settings.gradle android/gradle.properties; do
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup-$(date +%Y%m%d-%H%M%S)"
        echo "✓ Backed up $file"
    fi
done

# Create clean configuration files
echo "Creating clean configuration files..."
create_clean_build_gradle
echo "✓ Created clean android/build.gradle"

create_clean_app_build_gradle
echo "✓ Created clean android/app/build.gradle"

create_clean_settings_gradle
echo "✓ Created clean android/settings.gradle"

create_clean_gradle_properties
echo "✓ Created clean android/gradle.properties"

# Clean build directories
echo "Cleaning build directories..."
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle
echo "✓ Cleaned build directories"

# Remove any custom gradle files
echo "Removing custom gradle configurations..."
find android -name "*.gradle" -path "*/build/*" -delete
rm -f android/resolution-strategy.gradle
rm -f android/app-exclusions.gradle
echo "✓ Removed custom configurations"

echo ""
echo "✓ Solution D applied successfully!"
echo "The Android configuration has been reset to a clean template."
echo ""
echo "Next steps:"
echo "1. Run: cd android && ./gradlew clean"
echo "2. Run: npm install"
echo "3. Run: cd android && ./gradlew assembleDebug"
echo ""
echo "Note: This is a minimal configuration. You may need to re-add"
echo "any project-specific dependencies or configurations."
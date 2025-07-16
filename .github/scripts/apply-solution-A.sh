#!/bin/bash
# Solution A: Version alignment - Fix all gradle/kotlin/ndk versions to match RN 0.73.6

echo "=== Applying Solution A: Version Alignment ==="

# Update android/gradle.properties
cat > android/gradle.properties << 'EOF'
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true

# React Native 0.73.6 specific versions
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
newArchEnabled=false
hermesEnabled=true

# Version alignment
FLIPPER_VERSION=0.182.0
android.minSdkVersion=21
android.compileSdkVersion=34
android.targetSdkVersion=34
android.buildToolsVersion=34.0.0
android.ndkVersion=25.1.8937393
EOF

# Update android/build.gradle
cat > android/build.gradle << 'EOF'
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.8.0"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url("https://www.jitpack.io") }
    }
}
EOF

# Update android/gradle/wrapper/gradle-wrapper.properties
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Update android/app/build.gradle
cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
    hermesCommand = "../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
    codegenDir = file("../../node_modules/@react-native/codegen")
    reactNativeDir = file("../../node_modules/react-native")
    debuggableVariants = ["debug"]
}

def enableProguardInReleaseBuilds = false
def jscFlavor = 'org.webkit:android-jsc:+'

android {
    ndkVersion rootProject.ext.ndkVersion
    compileSdkVersion rootProject.ext.compileSdkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion

    namespace "com.productivityapp"
    
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
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
    
    packagingOptions {
        pickFirst '**/armeabi-v7a/libc++_shared.so'
        pickFirst '**/x86/libc++_shared.so'
        pickFirst '**/arm64-v8a/libc++_shared.so'
        pickFirst '**/x86_64/libc++_shared.so'
        pickFirst '**/armeabi-v7a/libjsc.so'
        pickFirst '**/x86/libjsc.so'
        pickFirst '**/arm64-v8a/libjsc.so'
        pickFirst '**/x86_64/libjsc.so'
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
EOF

echo "Solution A applied successfully!"
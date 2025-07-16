#!/bin/bash
# Solution E: Force resolutions - Use gradle resolution strategies

echo "=== Applying Solution E: Force Resolutions ==="

# Update android/build.gradle with resolution strategies
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
    
    configurations.all {
        resolutionStrategy {
            // Force specific versions
            force 'com.facebook.react:react-native:0.73.6'
            force 'com.facebook.react:hermes-android:0.73.6'
            force 'com.facebook.soloader:soloader:0.10.5'
            force 'com.facebook.fbjni:fbjni:0.3.0'
            force 'com.facebook.yoga:proguard-annotations:1.19.0'
            
            // AndroidX versions
            force 'androidx.appcompat:appcompat:1.6.1'
            force 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
            force 'androidx.lifecycle:lifecycle-runtime:2.5.1'
            force 'androidx.autofill:autofill:1.1.0'
            
            // Kotlin
            force "org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlinVersion"
            
            // Exclude problematic transitive dependencies
            exclude group: 'com.facebook.react', module: 'react-native-gradle-plugin'
            
            // Cache dynamic versions for faster builds
            cacheDynamicVersionsFor 10, 'minutes'
            cacheChangingModulesFor 10, 'minutes'
        }
    }
}

// Dependency substitution rules
allprojects {
    configurations.all {
        resolutionStrategy.dependencySubstitution {
            // Substitute any conflicting versions
            substitute module('com.facebook.react:react-native') using module('com.facebook.react:react-native:0.73.6')
            substitute module('com.facebook.react:hermes-android') using module('com.facebook.react:hermes-android:0.73.6')
        }
    }
}
EOF

# Update android/app/build.gradle with specific dependency configurations
cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
    hermesCommand = "../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
    codegenDir = file("../../node_modules/@react-native/codegen")
}

def enableProguardInReleaseBuilds = false
def jscFlavor = 'org.webkit:android-jsc:+'

android {
    ndkVersion rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion

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
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
        
        // Exclude duplicate files
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/NOTICE.txt'
    }
}

configurations {
    all {
        resolutionStrategy {
            // App-level forced resolutions
            force 'com.facebook.react:react-android:0.73.6'
            force 'com.facebook.react:hermes-android:0.73.6'
            
            // Exclude conflicting modules
            exclude group: 'com.facebook.react', module: 'react-native-gradle-plugin'
        }
    }
    
    // Clean up implementation configuration
    implementation {
        exclude group: 'com.facebook.fbjni', module: 'fbjni-java-only'
        exclude group: 'com.facebook.flipper'
    }
}

dependencies {
    implementation("com.facebook.react:react-android:0.73.6")
    implementation("com.facebook.react:hermes-android:0.73.6")
    
    // Ensure compatible versions
    implementation("com.facebook.soloader:soloader:0.10.5")
    implementation("com.facebook.fbjni:fbjni:0.3.0")
    
    // AndroidX dependencies with forced versions
    implementation("androidx.appcompat:appcompat:1.6.1") {
        force = true
    }
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0") {
        force = true
    }
    
    if (!hermesEnabled.toBoolean()) {
        implementation jscFlavor
    }
}

// Apply resolution strategy to all configurations
afterEvaluate {
    configurations.all {
        resolutionStrategy {
            force 'com.facebook.react:react-native:0.73.6'
            force 'com.facebook.react:hermes-android:0.73.6'
        }
    }
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
EOF

# Create gradle configuration to handle AsyncStorage
cat > android/asyncstorage-resolution.gradle << 'EOF'
// AsyncStorage resolution configuration
project.afterEvaluate {
    if (project.hasProperty("react-native-async-storage_async-storage")) {
        project.configurations.all {
            resolutionStrategy {
                force 'com.facebook.react:react-native:0.73.6'
            }
        }
    }
}
EOF

# Update settings.gradle to apply resolution
cat > android/settings.gradle << 'EOF'
rootProject.name = 'productivityapp'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')

// Apply resolution configuration
gradle.beforeProject { project ->
    if (project.name == '@react-native-async-storage_async-storage') {
        apply from: file("../asyncstorage-resolution.gradle")
    }
}
EOF

echo "Solution E applied successfully!"
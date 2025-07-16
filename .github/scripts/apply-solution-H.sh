#!/bin/bash
# Solution H: Custom gradle plugin - Create custom plugin to handle conflicts

echo "=== Applying Solution H: Custom Gradle Plugin ==="

# Create custom gradle plugin directory
mkdir -p buildSrc/src/main/groovy/com/productivityapp
mkdir -p buildSrc/src/main/resources/META-INF/gradle-plugins

# Create build.gradle for buildSrc
cat > buildSrc/build.gradle << 'EOF'
plugins {
    id 'groovy-gradle-plugin'
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.android.tools.build:gradle:8.1.1'
}
EOF

# Create the custom plugin
cat > buildSrc/src/main/groovy/com/productivityapp/DependencyResolverPlugin.groovy << 'EOF'
package com.productivityapp

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.Configuration
import org.gradle.api.artifacts.DependencyResolveDetails

class DependencyResolverPlugin implements Plugin<Project> {
    
    @Override
    void apply(Project project) {
        project.logger.lifecycle("Applying ProductivityApp Dependency Resolver Plugin")
        
        // Define version mappings
        def versionMappings = [
            'com.facebook.react:react-native': '0.73.6',
            'com.facebook.react:hermes-android': '0.73.6',
            'com.facebook.soloader:soloader': '0.10.5',
            'com.facebook.fbjni:fbjni': '0.3.0',
            'androidx.appcompat:appcompat': '1.6.1',
            'androidx.swiperefreshlayout:swiperefreshlayout': '1.1.0'
        ]
        
        // Define modules to exclude
        def modulesToExclude = [
            'react-native-gradle-plugin',
            'flipper',
            'flipper-network-plugin',
            'flipper-fresco-plugin'
        ]
        
        // Apply to all configurations
        project.configurations.all { Configuration configuration ->
            
            // Exclude problematic modules
            modulesToExclude.each { module ->
                configuration.exclude group: 'com.facebook.flipper', module: module
                configuration.exclude group: 'com.facebook.react', module: module
            }
            
            // Force specific versions
            configuration.resolutionStrategy { strategy ->
                strategy.eachDependency { DependencyResolveDetails details ->
                    def key = "${details.requested.group}:${details.requested.name}"
                    if (versionMappings.containsKey(key)) {
                        details.useVersion versionMappings[key]
                        project.logger.info("Forcing ${key} to version ${versionMappings[key]}")
                    }
                }
                
                // Cache for performance
                strategy.cacheDynamicVersionsFor 10, 'minutes'
                strategy.cacheChangingModulesFor 10, 'minutes'
            }
        }
        
        // Handle AsyncStorage specifically
        project.afterEvaluate {
            handleAsyncStorage(project)
        }
        
        // Add custom tasks
        addCustomTasks(project)
    }
    
    private void handleAsyncStorage(Project project) {
        project.configurations.all { configuration ->
            configuration.incoming.beforeResolve {
                // Remove AsyncStorage if it causes conflicts
                configuration.dependencies.removeAll { dependency ->
                    dependency.name == '@react-native-async-storage_async-storage'
                }
            }
        }
    }
    
    private void addCustomTasks(Project project) {
        // Task to analyze dependencies
        project.task('analyzeDependencies') {
            doLast {
                project.configurations.each { conf ->
                    if (conf.canBeResolved) {
                        println "\nConfiguration: ${conf.name}"
                        try {
                            conf.resolvedConfiguration.resolvedArtifacts.each { artifact ->
                                println "  - ${artifact.moduleVersion.id}"
                            }
                        } catch (Exception e) {
                            println "  - Could not resolve: ${e.message}"
                        }
                    }
                }
            }
        }
        
        // Task to clean build cache
        project.task('cleanBuildCache') {
            doLast {
                project.delete project.buildDir
                project.delete "${project.rootDir}/.gradle"
                println "Build cache cleaned"
            }
        }
    }
}
EOF

# Create plugin properties file
cat > buildSrc/src/main/resources/META-INF/gradle-plugins/com.productivityapp.dependency-resolver.properties << 'EOF'
implementation-class=com.productivityapp.DependencyResolverPlugin
EOF

# Create another plugin for React Native specific fixes
cat > buildSrc/src/main/groovy/com/productivityapp/ReactNativeFixPlugin.groovy << 'EOF'
package com.productivityapp

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.tasks.Copy

class ReactNativeFixPlugin implements Plugin<Project> {
    
    @Override
    void apply(Project project) {
        project.logger.lifecycle("Applying React Native Fix Plugin")
        
        // Fix React Native 0.73.6 specific issues
        project.afterEvaluate {
            fixReactNativeIssues(project)
        }
    }
    
    private void fixReactNativeIssues(Project project) {
        // Fix packagingOptions
        if (project.android) {
            project.android.packagingOptions {
                pickFirst '**/libc++_shared.so'
                pickFirst '**/libjsc.so'
                pickFirst '**/libhermes.so'
                pickFirst '**/libjscexecutor.so'
                
                exclude 'META-INF/DEPENDENCIES'
                exclude 'META-INF/LICENSE'
                exclude 'META-INF/LICENSE.txt'
                exclude 'META-INF/NOTICE'
                exclude 'META-INF/NOTICE.txt'
            }
        }
        
        // Fix namespace issues
        if (project.android && !project.android.namespace) {
            project.android.namespace = project.android.defaultConfig.applicationId
        }
        
        // Add task to fix node_modules permissions
        project.task('fixNodeModulesPermissions', type: Copy) {
            from "${project.rootDir}/node_modules"
            into "${project.rootDir}/node_modules"
            fileMode = 0755
            dirMode = 0755
        }
    }
}
EOF

# Create plugin properties for ReactNativeFixPlugin
cat > buildSrc/src/main/resources/META-INF/gradle-plugins/com.productivityapp.react-native-fix.properties << 'EOF'
implementation-class=com.productivityapp.ReactNativeFixPlugin
EOF

# Update android/build.gradle to use the plugins
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

// Apply custom plugins
apply plugin: 'com.productivityapp.dependency-resolver'

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url("https://www.jitpack.io") }
    }
}
EOF

# Update android/app/build.gradle to use the plugins
cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"
apply plugin: "com.productivityapp.dependency-resolver"
apply plugin: "com.productivityapp.react-native-fix"

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

// Run custom tasks
tasks.preBuild.dependsOn 'fixNodeModulesPermissions'
EOF

echo "Solution H applied successfully!"
echo "Custom gradle plugins created to handle dependency conflicts."
echo "Run './gradlew analyzeDependencies' to analyze current dependencies."
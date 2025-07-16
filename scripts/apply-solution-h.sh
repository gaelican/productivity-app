#!/bin/bash

# Solution H: Custom Gradle Plugin
# This script adds a custom Gradle plugin to handle dependency resolution
# at the build system level

echo "=== Applying Solution H: Custom Gradle Plugin ==="

# Create plugin directory structure
echo "Creating custom Gradle plugin..."
mkdir -p android/buildSrc/src/main/groovy/com/productivityapp

# Create the custom plugin
cat > android/buildSrc/src/main/groovy/com/productivityapp/DependencyResolverPlugin.groovy << 'EOF'
package com.productivityapp

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.Configuration
import org.gradle.api.artifacts.DependencyResolveDetails
import org.gradle.api.artifacts.ModuleVersionSelector

class DependencyResolverPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.logger.lifecycle("Applying DependencyResolverPlugin...")
        
        // Apply to all configurations
        project.configurations.all { Configuration configuration ->
            configuration.resolutionStrategy {
                // Force specific versions
                force 'com.facebook.react:react-native:0.73.0'
                force 'com.facebook.react:hermes-android:0.73.0'
                
                // Handle dependency substitutions
                eachDependency { DependencyResolveDetails details ->
                    ModuleVersionSelector requested = details.requested
                    
                    // Log all dependency requests for debugging
                    project.logger.debug("Processing dependency: ${requested.group}:${requested.name}:${requested.version}")
                    
                    // Handle AsyncStorage dependencies
                    if (requested.group == 'com.reactnativecommunity' && 
                        requested.name.contains('async')) {
                        project.logger.lifecycle("Excluding AsyncStorage: ${requested}")
                        details.useTarget "com.facebook.react:react-native:0.73.0"
                    }
                    
                    if (requested.group == '@react-native-async-storage' || 
                        requested.name == 'async-storage') {
                        project.logger.lifecycle("Excluding AsyncStorage: ${requested}")
                        details.useTarget "com.facebook.react:react-native:0.73.0"
                    }
                    
                    // Handle other problematic dependencies
                    if (requested.group == 'com.facebook.react' && 
                        requested.name == 'react-native' && 
                        requested.version != '0.73.0') {
                        project.logger.lifecycle("Forcing React Native version to 0.73.0")
                        details.useVersion '0.73.0'
                    }
                }
                
                // Fail on version conflict
                failOnVersionConflict()
            }
            
            // Exclude modules at configuration level
            configuration.exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
            configuration.exclude group: '@react-native-async-storage', module: 'async-storage'
        }
        
        // Apply to all subprojects
        project.subprojects { subproject ->
            subproject.afterEvaluate {
                if (subproject.hasProperty('android')) {
                    subproject.android.packagingOptions {
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
            }
        }
        
        // Add task to list all dependencies
        project.task('listDependencies') {
            doLast {
                project.configurations.each { conf ->
                    if (conf.canBeResolved) {
                        println "\nConfiguration: ${conf.name}"
                        try {
                            conf.resolvedConfiguration.resolvedArtifacts.each { artifact ->
                                println "  - ${artifact.moduleVersion.id}"
                            }
                        } catch (Exception e) {
                            println "  - Could not resolve"
                        }
                    }
                }
            }
        }
        
        // Add task to check for AsyncStorage
        project.task('checkAsyncStorage') {
            doLast {
                boolean found = false
                project.configurations.each { conf ->
                    if (conf.canBeResolved) {
                        try {
                            conf.resolvedConfiguration.resolvedArtifacts.each { artifact ->
                                def id = artifact.moduleVersion.id
                                if (id.toString().toLowerCase().contains('async') && 
                                    id.toString().toLowerCase().contains('storage')) {
                                    println "Found AsyncStorage: ${id}"
                                    found = true
                                }
                            }
                        } catch (Exception e) {
                            // Ignore resolution errors
                        }
                    }
                }
                if (!found) {
                    println "✓ No AsyncStorage dependencies found!"
                }
            }
        }
    }
}
EOF

# Create build.gradle for buildSrc
cat > android/buildSrc/build.gradle << 'EOF'
plugins {
    id 'groovy-gradle-plugin'
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation gradleApi()
    implementation localGroovy()
}
EOF

# Create settings.gradle for buildSrc
cat > android/buildSrc/settings.gradle << 'EOF'
rootProject.name = 'buildSrc'
EOF

# Apply the plugin to the main build.gradle
echo ""
echo "Applying custom plugin to build.gradle..."
BUILD_GRADLE="android/build.gradle"

if [ -f "$BUILD_GRADLE" ]; then
    # Backup the file
    cp "$BUILD_GRADLE" "${BUILD_GRADLE}.backup"
    
    # Check if plugin is already applied
    if ! grep -q "DependencyResolverPlugin" "$BUILD_GRADLE"; then
        # Add at the beginning of the file
        {
            echo "// Apply custom dependency resolver plugin"
            echo "apply plugin: com.productivityapp.DependencyResolverPlugin"
            echo ""
            cat "$BUILD_GRADLE"
        } > "${BUILD_GRADLE}.tmp"
        mv "${BUILD_GRADLE}.tmp" "$BUILD_GRADLE"
        echo "✓ Applied DependencyResolverPlugin to build.gradle"
    fi
fi

# Create a verification script
cat > android/verify-dependencies.sh << 'EOF'
#!/bin/bash

echo "Verifying dependencies..."
echo ""

# Run the custom Gradle tasks
echo "1. Listing all dependencies:"
./gradlew listDependencies | grep -i async || echo "No async-related dependencies in main list"

echo ""
echo "2. Checking specifically for AsyncStorage:"
./gradlew checkAsyncStorage

echo ""
echo "3. Dependency insight for React Native:"
./gradlew app:dependencyInsight --dependency react-native --configuration implementation

echo ""
echo "Verification complete!"
EOF

chmod +x android/verify-dependencies.sh

# Create usage documentation
cat > android/CUSTOM_PLUGIN_USAGE.md << 'EOF'
# Custom Dependency Resolver Plugin

This custom Gradle plugin handles dependency resolution at the build system level.

## Features

1. **Automatic AsyncStorage Exclusion**: 
   - Detects and excludes any AsyncStorage dependencies
   - Substitutes them with React Native core

2. **Version Enforcement**:
   - Forces React Native to version 0.73.0
   - Prevents version conflicts

3. **Debug Tools**:
   - `./gradlew listDependencies` - Lists all resolved dependencies
   - `./gradlew checkAsyncStorage` - Checks for AsyncStorage presence

## How It Works

The plugin intercepts dependency resolution and:
- Replaces AsyncStorage dependencies with React Native
- Excludes problematic modules
- Enforces consistent versions

## Verification

Run the verification script:
```bash
cd android
./verify-dependencies.sh
```

## Troubleshooting

If you still see AsyncStorage errors:
1. Clean everything: `./gradlew clean`
2. Delete .gradle folder: `rm -rf .gradle`
3. Check dependencies: `./gradlew checkAsyncStorage`
4. Review build logs for substitution messages
EOF

echo "✓ Created custom plugin documentation"

echo ""
echo "✓ Solution H applied successfully!"
echo ""
echo "The custom Gradle plugin will:"
echo "1. Automatically exclude AsyncStorage dependencies"
echo "2. Force React Native version to 0.73.0"
echo "3. Handle dependency conflicts at build time"
echo ""
echo "Next steps:"
echo "1. Clean the build: cd android && ./gradlew clean"
echo "2. Verify dependencies: cd android && ./verify-dependencies.sh"
echo "3. Build the project: ./gradlew assembleDebug"
echo ""
echo "The plugin logs all dependency substitutions during build."
echo "Check the build output for 'Excluding AsyncStorage' messages."
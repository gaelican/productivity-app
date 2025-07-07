#!/usr/bin/env python3
"""
Generate patch files for common React Native Android build issues
These patches can be applied during the build process
"""

import os
import json

class PatchGenerator:
    def __init__(self):
        self.patches = []
        
    def add_patch(self, file_path: str, patch_type: str, content: str, description: str):
        """Add a patch to the collection"""
        self.patches.append({
            'file': file_path,
            'type': patch_type,
            'content': content,
            'description': description
        })
    
    def generate_namespace_patches(self):
        """Generate patches for missing namespaces"""
        libraries = [
            ('expo-modules-core', 'expo.modules'),
            ('expo-constants', 'expo.modules.constants'),
            ('expo-file-system', 'expo.modules.filesystem'),
            ('expo-font', 'expo.modules.font'),
            ('expo-keep-awake', 'expo.modules.keepawake'),
            ('expo-splash-screen', 'expo.modules.splashscreen'),
            ('@nozbe/watermelondb', 'com.nozbe.watermelondb'),
            ('@react-native-community/datetimepicker', 'com.reactcommunity.rndatetimepicker'),
            ('@react-native-async-storage/async-storage', 'com.reactnativecommunity.asyncstorage'),
            ('@react-native-community/netinfo', 'com.reactnativecommunity.netinfo'),
            ('react-native-gesture-handler', 'com.swmansion.gesturehandler'),
            ('react-native-reanimated', 'com.swmansion.reanimated'),
            ('react-native-screens', 'com.swmansion.rnscreens'),
            ('react-native-safe-area-context', 'com.th3rdwave.safeareacontext'),
            ('react-native-svg', 'com.horcrux.svg'),
        ]
        
        for lib_name, namespace in libraries:
            patch_content = f"""
--- a/node_modules/{lib_name}/android/build.gradle
+++ b/node_modules/{lib_name}/android/build.gradle
@@ -1,5 +1,6 @@
 android {{
+    namespace "{namespace}"
     compileSdkVersion safeExtGet('compileSdkVersion', 33)
"""
            
            self.add_patch(
                f"node_modules/{lib_name}/android/build.gradle",
                "namespace",
                patch_content,
                f"Add namespace to {lib_name}"
            )
    
    def generate_buildconfig_patches(self):
        """Generate patches for missing BuildConfig"""
        libraries = [
            '@react-native-community/datetimepicker',
            'react-native-gesture-handler',
            'react-native-reanimated',
        ]
        
        for lib_name in libraries:
            patch_content = f"""
--- a/node_modules/{lib_name}/android/build.gradle
+++ b/node_modules/{lib_name}/android/build.gradle
@@ -5,6 +5,10 @@ android {{
     defaultConfig {{
         minSdkVersion safeExtGet('minSdkVersion', 21)
     }}
+    
+    buildFeatures {{
+        buildConfig = true
+    }}
 }}
"""
            
            self.add_patch(
                f"node_modules/{lib_name}/android/build.gradle",
                "buildconfig",
                patch_content,
                f"Enable BuildConfig for {lib_name}"
            )
    
    def generate_gradle_script(self):
        """Generate a Gradle script that applies fixes during build"""
        script_content = """
// Android Build Fixes for React Native 0.73.6
// Add this to android/app/build.gradle or create a separate .gradle file

// Function to add namespace if missing
def addNamespaceIfMissing(projectPath, namespace) {
    def buildFile = file("$rootDir/../node_modules/$projectPath/android/build.gradle")
    if (buildFile.exists()) {
        def content = buildFile.text
        if (!content.contains('namespace')) {
            def newContent = content.replaceFirst(
                /android\\s*\\{/,
                "android {\\n    namespace \\"$namespace\\""
            )
            buildFile.text = newContent
            println "Added namespace to $projectPath"
        }
    }
}

// Function to enable BuildConfig if missing
def enableBuildConfigIfMissing(projectPath) {
    def buildFile = file("$rootDir/../node_modules/$projectPath/android/build.gradle")
    if (buildFile.exists()) {
        def content = buildFile.text
        if (!content.contains('buildFeatures') || !content.contains('buildConfig')) {
            def newContent = content.replaceFirst(
                /(android\\s*\\{[^}]*)/,
                '$1\\n    buildFeatures {\\n        buildConfig = true\\n    }'
            )
            buildFile.text = newContent
            println "Enabled BuildConfig for $projectPath"
        }
    }
}

// Apply fixes before build
preBuild.doFirst {
    // Add namespaces
    addNamespaceIfMissing('expo-modules-core', 'expo.modules')
    addNamespaceIfMissing('expo-constants', 'expo.modules.constants')
    addNamespaceIfMissing('expo-file-system', 'expo.modules.filesystem')
    addNamespaceIfMissing('expo-font', 'expo.modules.font')
    addNamespaceIfMissing('expo-keep-awake', 'expo.modules.keepawake')
    addNamespaceIfMissing('expo-splash-screen', 'expo.modules.splashscreen')
    addNamespaceIfMissing('@nozbe/watermelondb', 'com.nozbe.watermelondb')
    addNamespaceIfMissing('@react-native-community/datetimepicker', 'com.reactcommunity.rndatetimepicker')
    addNamespaceIfMissing('@react-native-async-storage/async-storage', 'com.reactnativecommunity.asyncstorage')
    addNamespaceIfMissing('@react-native-community/netinfo', 'com.reactnativecommunity.netinfo')
    addNamespaceIfMissing('react-native-gesture-handler', 'com.swmansion.gesturehandler')
    addNamespaceIfMissing('react-native-reanimated', 'com.swmansion.reanimated')
    addNamespaceIfMissing('react-native-screens', 'com.swmansion.rnscreens')
    addNamespaceIfMissing('react-native-safe-area-context', 'com.th3rdwave.safeareacontext')
    addNamespaceIfMissing('react-native-svg', 'com.horcrux.svg')
    
    // Enable BuildConfig
    enableBuildConfigIfMissing('@react-native-community/datetimepicker')
    enableBuildConfigIfMissing('react-native-gesture-handler')
    enableBuildConfigIfMissing('react-native-reanimated')
}

// Alternative: Apply fixes after dependencies are extracted
afterEvaluate {
    tasks.findAll { task ->
        task.name.startsWith('generate') && task.name.endsWith('Sources')
    }.each { task ->
        task.doFirst {
            println "Applying Android build fixes..."
            // Apply the same fixes here
        }
    }
}
"""
        
        return script_content
    
    def generate_patch_script(self):
        """Generate a shell script that applies patches"""
        script_content = """#!/bin/bash
# Apply Android build fixes for React Native 0.73.6

echo "Applying Android build fixes..."

# Function to add namespace to build.gradle
add_namespace() {
    local file=$1
    local namespace=$2
    
    if [ -f "$file" ]; then
        if ! grep -q "namespace" "$file"; then
            sed -i "/android {/a\\    namespace \\"$namespace\\"" "$file"
            echo "Added namespace to $file"
        fi
    fi
}

# Function to enable BuildConfig
enable_buildconfig() {
    local file=$1
    
    if [ -f "$file" ]; then
        if ! grep -q "buildConfig = true" "$file"; then
            # Add buildFeatures block after defaultConfig
            sed -i '/defaultConfig {/,/}/a\\
\\    buildFeatures {\\
\\        buildConfig = true\\
\\    }' "$file"
            echo "Enabled BuildConfig in $file"
        fi
    fi
}

# Apply namespace fixes
add_namespace "node_modules/expo-modules-core/android/build.gradle" "expo.modules"
add_namespace "node_modules/expo-constants/android/build.gradle" "expo.modules.constants"
add_namespace "node_modules/expo-file-system/android/build.gradle" "expo.modules.filesystem"
add_namespace "node_modules/expo-font/android/build.gradle" "expo.modules.font"
add_namespace "node_modules/expo-keep-awake/android/build.gradle" "expo.modules.keepawake"
add_namespace "node_modules/expo-splash-screen/android/build.gradle" "expo.modules.splashscreen"
add_namespace "node_modules/@nozbe/watermelondb/native/android/build.gradle" "com.nozbe.watermelondb"
add_namespace "node_modules/@react-native-community/datetimepicker/android/build.gradle" "com.reactcommunity.rndatetimepicker"
add_namespace "node_modules/@react-native-async-storage/async-storage/android/build.gradle" "com.reactnativecommunity.asyncstorage"
add_namespace "node_modules/@react-native-community/netinfo/android/build.gradle" "com.reactnativecommunity.netinfo"
add_namespace "node_modules/react-native-gesture-handler/android/build.gradle" "com.swmansion.gesturehandler"
add_namespace "node_modules/react-native-reanimated/android/build.gradle" "com.swmansion.reanimated"
add_namespace "node_modules/react-native-screens/android/build.gradle" "com.swmansion.rnscreens"
add_namespace "node_modules/react-native-safe-area-context/android/build.gradle" "com.th3rdwave.safeareacontext"
add_namespace "node_modules/react-native-svg/android/build.gradle" "com.horcrux.svg"

# Apply BuildConfig fixes
enable_buildconfig "node_modules/@react-native-community/datetimepicker/android/build.gradle"
enable_buildconfig "node_modules/react-native-gesture-handler/android/build.gradle"
enable_buildconfig "node_modules/react-native-reanimated/android/build.gradle"

echo "Android build fixes applied!"
"""
        
        return script_content
    
    def save_all(self, output_dir: str = "patches"):
        """Save all generated patches and scripts"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate patches
        self.generate_namespace_patches()
        self.generate_buildconfig_patches()
        
        # Save patch list
        with open(f"{output_dir}/patches.json", 'w') as f:
            json.dump(self.patches, f, indent=2)
        
        # Save Gradle script
        with open(f"{output_dir}/apply-fixes.gradle", 'w') as f:
            f.write(self.generate_gradle_script())
        
        # Save shell script
        with open(f"{output_dir}/apply-fixes.sh", 'w') as f:
            f.write(self.generate_patch_script())
        
        # Make shell script executable
        os.chmod(f"{output_dir}/apply-fixes.sh", 0o755)
        
        # Save EAS build hook
        eas_hook = """#!/bin/bash
# EAS Build pre-install hook to apply Android fixes

echo "Running pre-install hook to fix Android build issues..."

# Apply fixes after npm install
if [ -f "patches/apply-fixes.sh" ]; then
    ./patches/apply-fixes.sh
fi
"""
        
        with open(f"{output_dir}/eas-build-pre-install.sh", 'w') as f:
            f.write(eas_hook)
        
        os.chmod(f"{output_dir}/eas-build-pre-install.sh", 0o755)
        
        print(f"Generated patches and scripts in '{output_dir}/' directory:")
        print(f"  - patches.json: List of all patches")
        print(f"  - apply-fixes.gradle: Gradle script to apply fixes during build")
        print(f"  - apply-fixes.sh: Shell script to apply fixes to node_modules")
        print(f"  - eas-build-pre-install.sh: EAS build hook")
        print(f"\nTo use:")
        print(f"  1. For local builds: Run ./patches/apply-fixes.sh after npm install")
        print(f"  2. For EAS builds: Add to eas.json:")
        print(f'     "build": {{ "pre-install": "./patches/eas-build-pre-install.sh" }}')
        print(f"  3. For Gradle integration: Add to android/app/build.gradle:")
        print(f"     apply from: '../../patches/apply-fixes.gradle'")

def main():
    generator = PatchGenerator()
    generator.save_all()

if __name__ == "__main__":
    main()
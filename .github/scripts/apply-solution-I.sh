#!/bin/bash
# Solution I: Patch packages - Directly patch node_modules

echo "=== Applying Solution I: Patch Packages ==="

# Install patch-package if not already installed
yarn add --dev patch-package postinstall-postinstall

# Create patches directory
mkdir -p patches

# Create patch for @react-native-async-storage/async-storage
cat > patches/@react-native-async-storage+async-storage+1.21.0.patch << 'EOF'
diff --git a/node_modules/@react-native-async-storage/async-storage/android/build.gradle b/node_modules/@react-native-async-storage/async-storage/android/build.gradle
index 1234567..7890abc 100644
--- a/node_modules/@react-native-async-storage/async-storage/android/build.gradle
+++ b/node_modules/@react-native-async-storage/async-storage/android/build.gradle
@@ -1,7 +1,7 @@
 buildscript {
   ext.safeExtGet = {prop, fallback ->
     rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
   }
   repositories {
     google()
     mavenCentral()
@@ -20,6 +20,10 @@ def safeExtGet(prop, fallback) {
 
 apply plugin: 'com.android.library'
 
+def resolveReactNativeVersion() {
+  return "0.73.6"
+}
+
 android {
   compileSdkVersion safeExtGet('compileSdkVersion', 34)
   buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')
@@ -65,10 +69,15 @@ repositories {
   mavenCentral()
 }
 
+configurations.all {
+  resolutionStrategy {
+    force "com.facebook.react:react-native:0.73.6"
+  }
+}
+
 dependencies {
   //noinspection GradleDynamicVersion
-  implementation 'com.facebook.react:react-native:+'
+  implementation "com.facebook.react:react-native:${resolveReactNativeVersion()}"
   implementation "androidx.sqlite:sqlite:2.2.0"
   implementation "androidx.sqlite:sqlite-framework:2.2.0"
 }
EOF

# Create patch for react-native-screens
cat > patches/react-native-screens+3.29.0.patch << 'EOF'
diff --git a/node_modules/react-native-screens/android/build.gradle b/node_modules/react-native-screens/android/build.gradle
index 1234567..7890abc 100644
--- a/node_modules/react-native-screens/android/build.gradle
+++ b/node_modules/react-native-screens/android/build.gradle
@@ -1,6 +1,14 @@
 def safeExtGet(prop, fallback) {
     rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
 }
+
+buildscript {
+  repositories {
+    google()
+    mavenCentral()
+  }
+}
+
 apply plugin: 'com.android.library'
 apply plugin: 'kotlin-android'
 
@@ -65,8 +73,13 @@ repositories {
   mavenCentral()
 }
 
+configurations.all {
+  resolutionStrategy {
+    force "com.facebook.react:react-native:0.73.6"
+  }
+}
+
 dependencies {
   implementation 'com.facebook.react:react-native:+'
   implementation 'androidx.appcompat:appcompat:1.6.1'
   implementation 'androidx.fragment:fragment:1.5.5'
EOF

# Create patch for react-native-safe-area-context
cat > patches/react-native-safe-area-context+4.8.2.patch << 'EOF'
diff --git a/node_modules/react-native-safe-area-context/android/build.gradle b/node_modules/react-native-safe-area-context/android/build.gradle
index 1234567..7890abc 100644
--- a/node_modules/react-native-safe-area-context/android/build.gradle
+++ b/node_modules/react-native-safe-area-context/android/build.gradle
@@ -66,8 +66,13 @@ repositories {
   mavenCentral()
 }
 
+configurations.all {
+  resolutionStrategy {
+    force "com.facebook.react:react-native:0.73.6"
+  }
+}
+
 dependencies {
-  implementation 'com.facebook.react:react-native:+'
+  implementation 'com.facebook.react:react-native:0.73.6'
 }
EOF

# Create a script to apply patches programmatically
cat > apply-patches.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Function to patch a file
function patchFile(filePath, patches) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  patches.forEach(patch => {
    if (content.includes(patch.search)) {
      content = content.replace(patch.search, patch.replace);
      modified = true;
      console.log(`Patched: ${filePath}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
}

// Patches to apply
const modulePatches = [
  {
    module: '@react-native-async-storage/async-storage',
    file: 'android/build.gradle',
    patches: [
      {
        search: "implementation 'com.facebook.react:react-native:+'",
        replace: "implementation 'com.facebook.react:react-native:0.73.6'"
      }
    ]
  },
  {
    module: 'react-native-screens',
    file: 'android/build.gradle',
    patches: [
      {
        search: "implementation 'com.facebook.react:react-native:+'",
        replace: "implementation 'com.facebook.react:react-native:0.73.6'"
      }
    ]
  },
  {
    module: 'react-native-safe-area-context',
    file: 'android/build.gradle',
    patches: [
      {
        search: "implementation 'com.facebook.react:react-native:+'",
        replace: "implementation 'com.facebook.react:react-native:0.73.6'"
      }
    ]
  }
];

// Apply patches
modulePatches.forEach(modulePatch => {
  const filePath = path.join('node_modules', modulePatch.module, modulePatch.file);
  patchFile(filePath, modulePatch.patches);
});

console.log('Patches applied successfully!');
EOF

# Create postinstall script
cat > postinstall.sh << 'EOF'
#!/bin/bash
echo "Running postinstall patches..."

# Apply JavaScript patches
node apply-patches.js

# Apply patch-package patches
npx patch-package

echo "Postinstall complete!"
EOF

chmod +x postinstall.sh

# Update package.json to include postinstall script
cat > update-package-json.js << 'EOF'
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add postinstall script
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts.postinstall = "./postinstall.sh";

// Save updated package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Updated package.json with postinstall script');
EOF

node update-package-json.js

# Create manual patch for problematic gradle files
cat > patch-gradle-files.sh << 'EOF'
#!/bin/bash

echo "Patching gradle files..."

# Function to patch gradle files
patch_gradle() {
  local file=$1
  if [ -f "$file" ]; then
    # Replace dynamic versions with fixed versions
    sed -i "s/implementation 'com.facebook.react:react-native:+'/implementation 'com.facebook.react:react-native:0.73.6'/g" "$file"
    sed -i "s/implementation('com.facebook.react:react-native:+')/implementation('com.facebook.react:react-native:0.73.6')/g" "$file"
    
    # Add resolution strategy if not present
    if ! grep -q "resolutionStrategy" "$file"; then
      sed -i '/dependencies {/i \
configurations.all {\
  resolutionStrategy {\
    force "com.facebook.react:react-native:0.73.6"\
  }\
}' "$file"
    fi
    
    echo "Patched: $file"
  fi
}

# Find and patch all build.gradle files in node_modules
find node_modules -name "build.gradle" -path "*/android/*" | while read file; do
  patch_gradle "$file"
done

echo "Gradle files patched!"
EOF

chmod +x patch-gradle-files.sh

# Create a comprehensive patch script
cat > apply-all-patches.sh << 'EOF'
#!/bin/bash

echo "=== Applying all patches ==="

# 1. Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  yarn install
fi

# 2. Apply JavaScript patches
echo "Applying JavaScript patches..."
node apply-patches.js

# 3. Apply gradle patches
echo "Applying gradle patches..."
./patch-gradle-files.sh

# 4. Apply patch-package patches
echo "Applying patch-package patches..."
npx patch-package

# 5. Clean gradle cache
echo "Cleaning gradle cache..."
cd android && ./gradlew clean
cd ..

echo "All patches applied successfully!"
EOF

chmod +x apply-all-patches.sh

# Run the patch script
./apply-all-patches.sh

echo "Solution I applied successfully!"
echo "All problematic packages have been patched."
echo "Run './apply-all-patches.sh' after any yarn/npm install."
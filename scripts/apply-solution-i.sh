#!/bin/bash

# Solution I: Namespace Migration
# This script adds namespace declarations to all Android modules
# to comply with Android Gradle Plugin 8.x requirements

echo "=== Applying Solution I: Namespace Migration ==="

# Function to add namespace to build.gradle
add_namespace_to_gradle() {
    local gradle_file="$1"
    local package_name="$2"
    
    if [ ! -f "$gradle_file" ]; then
        return 1
    fi
    
    # Check if namespace already exists
    if grep -q "namespace" "$gradle_file"; then
        echo "  ✓ Namespace already present in $gradle_file"
        return 0
    fi
    
    # Backup the file
    cp "$gradle_file" "${gradle_file}.backup-namespace"
    
    # Add namespace after android {
    awk -v ns="$package_name" '
    /android\s*{/ {
        print $0
        print "    namespace \"" ns "\""
        next
    }
    { print }
    ' "$gradle_file" > "${gradle_file}.tmp"
    
    mv "${gradle_file}.tmp" "$gradle_file"
    echo "  ✓ Added namespace '$package_name' to $gradle_file"
}

# Function to extract package name from AndroidManifest.xml
get_package_from_manifest() {
    local manifest_file="$1"
    if [ -f "$manifest_file" ]; then
        grep -o 'package="[^"]*"' "$manifest_file" | sed 's/package="\([^"]*\)"/\1/'
    fi
}

# Function to process a module directory
process_module() {
    local module_dir="$1"
    local module_name=$(basename "$module_dir")
    
    echo "Processing module: $module_name"
    
    local build_gradle="$module_dir/build.gradle"
    local manifest_file="$module_dir/src/main/AndroidManifest.xml"
    
    if [ ! -f "$build_gradle" ]; then
        echo "  ✗ No build.gradle found"
        return 1
    fi
    
    # Check if it's an Android module
    if ! grep -q "com.android.library\|com.android.application" "$build_gradle"; then
        echo "  ✗ Not an Android module"
        return 1
    fi
    
    # Get package name from manifest
    local package_name=""
    if [ -f "$manifest_file" ]; then
        package_name=$(get_package_from_manifest "$manifest_file")
    fi
    
    if [ -z "$package_name" ]; then
        # Use a default package name based on module name
        package_name="com.productivityapp.${module_name//[^a-zA-Z0-9]/_}"
        echo "  ⚠ No package found in manifest, using: $package_name"
    fi
    
    # Add namespace
    add_namespace_to_gradle "$build_gradle" "$package_name"
}

# Main app module
echo "1. Processing main app module..."
APP_MANIFEST="android/app/src/main/AndroidManifest.xml"
APP_PACKAGE=$(get_package_from_manifest "$APP_MANIFEST")
if [ -z "$APP_PACKAGE" ]; then
    APP_PACKAGE="com.productivityapp"
fi
add_namespace_to_gradle "android/app/build.gradle" "$APP_PACKAGE"

# Process node_modules Android libraries
echo ""
echo "2. Processing node_modules Android libraries..."
if [ -d "node_modules" ]; then
    # Find all Android modules in node_modules
    find node_modules -name "build.gradle" -path "*/android/*" -not -path "*/node_modules/*" | while read gradle_file; do
        module_dir=$(dirname "$gradle_file")
        if [ -f "$module_dir/src/main/AndroidManifest.xml" ] || [ -f "$module_dir/AndroidManifest.xml" ]; then
            process_module "$module_dir"
        fi
    done
else
    echo "  ⚠ node_modules not found. Run 'npm install' first."
fi

# Create a patch script for react-native modules
echo ""
echo "3. Creating patch script for React Native modules..."
cat > scripts/patch-rn-modules.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Patching React Native module namespaces...');

// List of common React Native modules that need patching
const modulesToPatch = [
    '@react-native-community/cli-platform-android',
    'react-native-gesture-handler',
    'react-native-reanimated',
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-svg',
    'react-native-vector-icons',
];

function getPackageFromManifest(manifestPath) {
    if (!fs.existsSync(manifestPath)) return null;
    
    const content = fs.readFileSync(manifestPath, 'utf8');
    const match = content.match(/package="([^"]+)"/);
    return match ? match[1] : null;
}

function addNamespaceToGradle(gradlePath, namespace) {
    if (!fs.existsSync(gradlePath)) return false;
    
    let content = fs.readFileSync(gradlePath, 'utf8');
    
    // Check if namespace already exists
    if (content.includes('namespace')) {
        console.log(`  ✓ Namespace already present in ${gradlePath}`);
        return true;
    }
    
    // Add namespace after android {
    content = content.replace(
        /android\s*{/,
        `android {\n    namespace "${namespace}"`
    );
    
    fs.writeFileSync(gradlePath, content);
    console.log(`  ✓ Added namespace '${namespace}' to ${gradlePath}`);
    return true;
}

function patchModule(moduleName) {
    const modulePath = path.join('node_modules', moduleName, 'android');
    
    if (!fs.existsSync(modulePath)) {
        console.log(`✗ Module not found: ${moduleName}`);
        return;
    }
    
    console.log(`\nPatching ${moduleName}...`);
    
    const gradlePath = path.join(modulePath, 'build.gradle');
    const manifestPath = path.join(modulePath, 'src/main/AndroidManifest.xml');
    
    // Try to get package from manifest
    let packageName = getPackageFromManifest(manifestPath);
    
    if (!packageName) {
        // Generate a package name
        packageName = moduleName.replace(/[@\/\-]/g, '.').replace(/^\.+|\.+$/g, '');
        console.log(`  ⚠ No package in manifest, using: ${packageName}`);
    }
    
    addNamespaceToGradle(gradlePath, packageName);
}

// Patch known modules
modulesToPatch.forEach(patchModule);

// Find and patch all other Android modules
console.log('\nSearching for other Android modules...');
const nodeModules = 'node_modules';
if (fs.existsSync(nodeModules)) {
    fs.readdirSync(nodeModules).forEach(dir => {
        const androidPath = path.join(nodeModules, dir, 'android');
        if (fs.existsSync(androidPath) && fs.existsSync(path.join(androidPath, 'build.gradle'))) {
            if (!modulesToPatch.includes(dir)) {
                patchModule(dir);
            }
        }
    });
}

console.log('\nPatching complete!');
EOF

chmod +x scripts/patch-rn-modules.js

# Create gradle.properties update
echo ""
echo "4. Updating gradle.properties..."
GRADLE_PROPS="android/gradle.properties"
if [ -f "$GRADLE_PROPS" ]; then
    # Backup
    cp "$GRADLE_PROPS" "${GRADLE_PROPS}.backup"
    
    # Ensure android.defaults.buildfeatures.buildconfig is set
    if ! grep -q "android.defaults.buildfeatures.buildconfig" "$GRADLE_PROPS"; then
        echo "" >> "$GRADLE_PROPS"
        echo "# Enable BuildConfig generation" >> "$GRADLE_PROPS"
        echo "android.defaults.buildfeatures.buildconfig=true" >> "$GRADLE_PROPS"
        echo "✓ Added buildconfig feature flag"
    fi
    
    # Ensure nonTransitiveRClass is set
    if ! grep -q "android.nonTransitiveRClass" "$GRADLE_PROPS"; then
        echo "" >> "$GRADLE_PROPS"
        echo "# Use non-transitive R classes" >> "$GRADLE_PROPS"
        echo "android.nonTransitiveRClass=true" >> "$GRADLE_PROPS"
        echo "✓ Added nonTransitiveRClass flag"
    fi
fi

# Create verification script
cat > android/verify-namespaces.sh << 'EOF'
#!/bin/bash

echo "Verifying namespace declarations..."
echo ""

# Check main app
echo "1. Main app module:"
if grep -q "namespace" app/build.gradle; then
    grep "namespace" app/build.gradle
else
    echo "  ✗ No namespace found!"
fi

# Check node_modules
echo ""
echo "2. Node modules with missing namespaces:"
find ../node_modules -name "build.gradle" -path "*/android/*" | while read gradle; do
    if grep -q "com.android.library\|com.android.application" "$gradle"; then
        if ! grep -q "namespace" "$gradle"; then
            echo "  ✗ $(dirname "$gradle")"
        fi
    fi
done

echo ""
echo "Verification complete!"
EOF

chmod +x android/verify-namespaces.sh

echo ""
echo "✓ Solution I applied successfully!"
echo ""
echo "Changes made:"
echo "1. Added namespace to android/app/build.gradle"
echo "2. Created patch script for node_modules"
echo "3. Updated gradle.properties with required flags"
echo "4. Created verification script"
echo ""
echo "Next steps:"
echo "1. Run the patch script: node scripts/patch-rn-modules.js"
echo "2. Verify namespaces: cd android && ./verify-namespaces.sh"
echo "3. Clean build: cd android && ./gradlew clean"
echo "4. Build the app: ./gradlew assembleDebug"
echo ""
echo "Note: You may need to run the patch script after each 'npm install'"
echo "as it modifies files in node_modules."
#!/bin/bash

# Solution J: Hybrid Approach
# This script combines solutions A (Gradle fix), B (AsyncStorage stub), 
# and I (Namespace migration) for a comprehensive fix

echo "=== Applying Solution J: Hybrid Approach ==="
echo "This combines:"
echo "- Solution A: Gradle Version Fix"
echo "- Solution B: AsyncStorage Stub"
echo "- Solution I: Namespace Migration"
echo ""

# Check if individual solution scripts exist
SCRIPT_DIR="$(dirname "$0")"
SOLUTION_A="$SCRIPT_DIR/apply-solution-a.sh"
SOLUTION_B="$SCRIPT_DIR/apply-solution-b.sh"
SOLUTION_I="$SCRIPT_DIR/apply-solution-i.sh"

# Function to run a solution script
run_solution() {
    local solution_script="$1"
    local solution_name="$2"
    
    if [ -f "$solution_script" ]; then
        echo "=================="
        echo "Running $solution_name..."
        echo "=================="
        bash "$solution_script"
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
            echo "✗ $solution_name failed with exit code $exit_code"
            return $exit_code
        fi
        echo ""
        echo "✓ $solution_name completed successfully"
        echo ""
        return 0
    else
        echo "✗ $solution_name script not found at $solution_script"
        return 1
    fi
}

# Track overall success
overall_success=true

# Step 1: Apply Gradle Version Fix
if ! run_solution "$SOLUTION_A" "Solution A (Gradle Version Fix)"; then
    overall_success=false
    echo "⚠ Continuing despite Solution A failure..."
fi

# Step 2: Apply AsyncStorage Stub
if ! run_solution "$SOLUTION_B" "Solution B (AsyncStorage Stub)"; then
    overall_success=false
    echo "⚠ Continuing despite Solution B failure..."
fi

# Step 3: Apply Namespace Migration
if ! run_solution "$SOLUTION_I" "Solution I (Namespace Migration)"; then
    overall_success=false
    echo "⚠ Continuing despite Solution I failure..."
fi

# Additional hybrid-specific configurations
echo "=================="
echo "Applying hybrid-specific configurations..."
echo "=================="

# Create combined gradle configuration
cat > android/hybrid-config.gradle << 'EOF'
// Hybrid configuration combining multiple solutions
ext {
    // Ensure we're using the correct versions
    buildToolsVersion = "34.0.0"
    minSdkVersion = 23
    compileSdkVersion = 34
    targetSdkVersion = 34
    
    // Force Gradle 8.3 compatibility
    if (gradle.gradleVersion < "8.3") {
        throw new GradleException("Gradle 8.3+ is required. Current version: ${gradle.gradleVersion}")
    }
}

// Apply to all projects
allprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            android {
                // Ensure namespace is set
                if (!android.hasProperty('namespace') || android.namespace == null) {
                    def manifestFile = file("src/main/AndroidManifest.xml")
                    if (manifestFile.exists()) {
                        def manifest = new XmlSlurper().parse(manifestFile)
                        def packageName = manifest.@package.toString()
                        if (packageName) {
                            namespace packageName
                            logger.lifecycle("Auto-set namespace: ${packageName}")
                        }
                    }
                }
                
                // Packaging options for compatibility
                packagingOptions {
                    exclude 'META-INF/DEPENDENCIES'
                    exclude 'META-INF/LICENSE'
                    exclude 'META-INF/LICENSE.txt'
                    exclude 'META-INF/NOTICE'
                    exclude 'META-INF/NOTICE.txt'
                    pickFirst '**/*.so'
                }
            }
        }
    }
}

// Exclude AsyncStorage from all configurations
subprojects {
    configurations.all {
        exclude group: 'com.reactnativecommunity', module: 'asyncstorage'
        exclude group: '@react-native-async-storage', module: 'async-storage'
        
        resolutionStrategy {
            force 'com.facebook.react:react-native:0.73.0'
            force 'com.facebook.react:hermes-android:0.73.0'
        }
    }
}
EOF

# Apply hybrid config to main build.gradle
BUILD_GRADLE="android/build.gradle"
if [ -f "$BUILD_GRADLE" ] && ! grep -q "hybrid-config.gradle" "$BUILD_GRADLE"; then
    echo "" >> "$BUILD_GRADLE"
    echo "apply from: 'hybrid-config.gradle'" >> "$BUILD_GRADLE"
    echo "✓ Applied hybrid configuration"
fi

# Create post-install script for the hybrid approach
cat > scripts/hybrid-postinstall.sh << 'EOF'
#!/bin/bash

echo "Running hybrid post-install tasks..."

# 1. Ensure AsyncStorage stub is in place
if [ ! -d "node_modules/@react-native-async-storage/async-storage/src" ]; then
    echo "AsyncStorage stub missing, recreating..."
    bash scripts/apply-solution-b.sh
fi

# 2. Patch React Native modules for namespaces
if [ -f "scripts/patch-rn-modules.js" ]; then
    echo "Patching module namespaces..."
    node scripts/patch-rn-modules.js
fi

# 3. Clean gradle caches
echo "Cleaning Gradle caches..."
cd android && ./gradlew clean
rm -rf .gradle/

echo "✓ Post-install tasks complete!"
EOF

chmod +x scripts/hybrid-postinstall.sh

# Update package.json with hybrid postinstall
if [ -f "package.json" ]; then
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts['postinstall'] = 'bash scripts/hybrid-postinstall.sh';
    pkg.scripts['android:clean'] = 'cd android && ./gradlew clean && cd ..';
    pkg.scripts['android:build'] = 'cd android && ./gradlew assembleDebug && cd ..';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('✓ Updated package.json with hybrid scripts');
    "
fi

# Create comprehensive build script
cat > build-hybrid.sh << 'EOF'
#!/bin/bash

echo "=== Hybrid Build Process ==="
echo ""

# 1. Clean everything
echo "Step 1: Cleaning..."
rm -rf node_modules
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle
rm -rf ~/.gradle/caches
echo "✓ Clean complete"

# 2. Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# 3. Verify setup
echo ""
echo "Step 3: Verifying setup..."
cd android

# Check Gradle version
echo "Gradle version:"
./gradlew --version | grep "Gradle"

# Check for AsyncStorage
echo ""
echo "Checking for AsyncStorage:"
find ../node_modules -name "async-storage" -type d | grep -v ".backup" || echo "✓ No AsyncStorage found"

# Check namespaces
echo ""
echo "Checking namespaces:"
if grep -q "namespace" app/build.gradle; then
    echo "✓ App namespace configured"
else
    echo "✗ App namespace missing!"
fi

cd ..

# 4. Build
echo ""
echo "Step 4: Building..."
cd android && ./gradlew assembleDebug

# 5. Check result
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "✓ BUILD SUCCESSFUL!"
    echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo ""
    echo "✗ BUILD FAILED!"
    exit 1
fi
EOF

chmod +x build-hybrid.sh

# Summary
echo ""
echo "=================="
echo "Hybrid Solution Applied!"
echo "=================="
echo ""

if [ "$overall_success" = true ]; then
    echo "✓ All solutions applied successfully!"
else
    echo "⚠ Some solutions had issues, but hybrid configuration is in place."
fi

echo ""
echo "The hybrid approach includes:"
echo "1. Gradle 8.3 (Solution A)"
echo "2. AsyncStorage stub module (Solution B)"
echo "3. Namespace declarations (Solution I)"
echo "4. Additional hybrid configurations"
echo ""
echo "Quick commands:"
echo "- Full build: ./build-hybrid.sh"
echo "- Clean only: npm run android:clean"
echo "- Build only: npm run android:build"
echo "- Post-install: npm run postinstall"
echo ""
echo "Next steps:"
echo "1. Run the full hybrid build: ./build-hybrid.sh"
echo "2. Or manually:"
echo "   - npm install"
echo "   - cd android && ./gradlew clean assembleDebug"
echo ""
echo "This hybrid approach provides the most comprehensive fix by"
echo "addressing Gradle compatibility, dependency conflicts, and"
echo "namespace requirements simultaneously."
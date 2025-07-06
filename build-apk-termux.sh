#!/bin/bash

# Build APK in Termux environment
echo "Building APK for Android..."

# Source notification helper
source ~/.claude/claude-notify-helper.sh

# Set environment variables
export ANDROID_HOME=$PREFIX
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Install Android SDK if not present
if [ ! -d "$PREFIX/cmdline-tools" ]; then
    echo "Installing Android SDK..."
    claude_notify_progress "Installing Android SDK components" 10 "save"
    
    pkg install aapt apksigner dx ecj -y
    
    # Download Android SDK command line tools
    mkdir -p $PREFIX/cmdline-tools
    cd $PREFIX/cmdline-tools
    wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
    unzip cmdline-tools.zip
    mv cmdline-tools latest
    rm cmdline-tools.zip
    cd -
fi

# Create a simple APK using React Native bundle and Termux tools
echo "Creating React Native bundle..."
claude_notify_progress "Creating JavaScript bundle" 30 "code"

cd /data/data/com.termux/files/home/monorepo-todo-app/apps/mobile

# Create bundle directory
mkdir -p android/app/src/main/assets

# Bundle JavaScript
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

claude_notify_progress "JavaScript bundle created" 50 "check_circle"

# Try simplified Gradle build
echo "Attempting Gradle build..."
claude_notify_progress "Building with Gradle" 60 "build"

cd android

# Create local.properties
echo "sdk.dir=$PREFIX" > local.properties

# Try to build
if ./gradlew assembleDebug 2>&1 | tee build.log; then
    echo "Build successful!"
    claude_notify_progress "APK built successfully" 100 "done_all"
    
    # Find and display APK location
    APK_PATH=$(find . -name "*.apk" -type f | head -1)
    if [ -n "$APK_PATH" ]; then
        echo "APK located at: $APK_PATH"
        echo "You can install it using: adb install $APK_PATH"
        
        # Copy to easy location
        cp "$APK_PATH" /data/data/com.termux/files/home/todo-app.apk
        echo "APK copied to: ~/todo-app.apk"
        
        claude_notify_session_complete "APK built successfully and saved to ~/todo-app.apk"
    fi
else
    echo "Gradle build failed. Check build.log for details."
    claude_notify_error "Gradle build failed - check build.log"
    
    # Fallback: Create basic APK structure manually
    echo "Attempting manual APK creation..."
    claude_notify_progress "Creating APK manually" 70 "build"
    
    # This would require more complex setup with aapt, dx, etc.
    # For now, we'll recommend using online build service
    
    echo ""
    echo "=== Alternative Build Options ==="
    echo "1. Use EAS Build (online): eas build --platform android"
    echo "2. Use Expo web build: npx expo export:web"
    echo "3. Transfer project to a computer with full Android SDK"
    echo ""
    
    claude_notify_session_complete "Build attempted - see alternative options above"
fi
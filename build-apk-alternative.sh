#!/bin/bash
# Alternative APK Build Script for React Native
# Use this when EAS Build doesn't work with bare workflow

echo "🚀 Alternative APK Build Process"
echo "================================"
echo ""
echo "Since EAS Build is incompatible with React Native bare workflow,"
echo "here are alternative ways to build your APK:"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Option 1: Using a computer with Android SDK
echo "📱 Option 1: Build on a computer with Android SDK"
echo "------------------------------------------------"
echo "1. Transfer this project to a computer with:"
echo "   - Node.js 18+"
echo "   - Android SDK"
echo "   - Java 17"
echo ""
echo "2. Run these commands:"
echo "   npm install"
echo "   cd android"
echo "   ./gradlew assembleRelease"
echo ""
echo "3. Find APK at: android/app/build/outputs/apk/release/app-release.apk"
echo ""

# Option 2: GitHub Actions
echo "🤖 Option 2: GitHub Actions (Recommended)"
echo "-----------------------------------------"
echo "1. Push your code to GitHub"
echo "2. Create .github/workflows/android.yml:"
echo ""
cat << 'EOF'
name: Android Build
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build Android Release
      run: |
        cd android
        ./gradlew assembleRelease
        
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: android/app/build/outputs/apk/release/app-release.apk
EOF
echo ""
echo "3. Download APK from GitHub Actions artifacts"
echo ""

# Option 3: Cloud Build Services
echo "☁️  Option 3: Cloud Build Services"
echo "---------------------------------"
echo "Use services like:"
echo "- Codemagic (codemagic.io)"
echo "- Bitrise (bitrise.io)"
echo "- CircleCI (circleci.com)"
echo "- App Center (appcenter.ms)"
echo ""

# Option 4: Docker
echo "🐳 Option 4: Docker Build"
echo "------------------------"
echo "1. Use a React Native Docker image:"
echo "   docker run -v \$(pwd):/app reactnativecommunity/react-native-android bash -c 'cd /app && npm install && cd android && ./gradlew assembleRelease'"
echo ""

# Option 5: Expo Prebuild
echo "📦 Option 5: Expo Prebuild + Manual Build"
echo "----------------------------------------"
echo "If you switch back to managed workflow:"
echo "1. Remove android/ directory"
echo "2. npx expo prebuild --platform android"
echo "3. cd android && ./gradlew assembleRelease"
echo ""

echo "💡 Tips:"
echo "--------"
echo "- For development, use: ./gradlew assembleDebug (faster)"
echo "- For production, ensure you have a signed keystore"
echo "- Test on a real device before distribution"
echo ""

echo "📝 Current Setup:"
echo "-----------------"
if [ "$CURRENT_BRANCH" == "downgrade-to-rn-073" ]; then
    echo "✓ React Native 0.73.6 (downgraded)"
    echo "✓ Expo SDK 50"
    echo "✓ Ready for manual builds"
else
    echo "✓ React Native 0.74.5"
    echo "✓ Expo SDK 51"
    echo "⚠️  May have gradle timing issues"
fi
echo ""

echo "🎯 Recommended Next Steps:"
echo "-------------------------"
echo "1. Push to GitHub and set up GitHub Actions"
echo "2. Use the generated APK for testing"
echo "3. Once working, automate with CI/CD"
echo "4. Consider migrating to Expo managed workflow long-term"
echo ""
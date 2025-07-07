#!/bin/bash
# Apply Android build fixes for React Native 0.73.6

echo "Applying Android build fixes..."

# Function to add namespace to build.gradle
add_namespace() {
    local file=$1
    local namespace=$2
    
    if [ -f "$file" ]; then
        if ! grep -q "namespace" "$file"; then
            sed -i "/android {/a\    namespace \"$namespace\"" "$file"
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
            sed -i '/defaultConfig {/,/}/a\
\    buildFeatures {\
\        buildConfig = true\
\    }' "$file"
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

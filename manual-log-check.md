# Manual EAS Log Check Instructions

Since automated log fetching is challenging in Termux, here's how to manually check and fix the build error:

## Latest Failed Build
- **Build ID**: 5487f401-cc5f-41f2-95c9-190b2fc4fdcb
- **Error**: EAS_BUILD_UNKNOWN_GRADLE_ERROR
- **URL**: https://expo.dev/accounts/gaelican/projects/productivity-app/builds/5487f401-cc5f-41f2-95c9-190b2fc4fdcb

## Steps to Check Logs:

1. **Open the build URL in a browser**
2. **Look for the "Run gradlew" phase**
3. **Find the specific error message**

## Common Gradle Errors and Fixes:

### 1. "Could not read script" Error
```bash
# Fix: Use simple settings.gradle
cat > android/settings.gradle << 'EOF'
rootProject.name = 'ProductivityApp'
include ':app'
EOF
```

### 2. "Namespace not specified" Error
```bash
# Add namespace to app/build.gradle
sed -i '/android {/a\    namespace "com.productivityapp"' android/app/build.gradle
```

### 3. "React Native Gradle Plugin" Error
```bash
# Remove the plugin reference
sed -i '/react-native-gradle-plugin/d' android/build.gradle
```

### 4. Memory Error
```bash
echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m" >> android/gradle.properties
```

## Automated Fix Based on Error Pattern

Once you know the error, run:

```bash
# For settings.gradle errors
./fix-eas-settings-gradle.sh

# For general fixes
./comprehensive-eas-fix.sh

# Then rebuild
eas build -p android --profile preview --clear-cache
```

## Alternative: Share Error Here

If you can copy the error message from the logs, paste it here and I can apply the specific fix needed.
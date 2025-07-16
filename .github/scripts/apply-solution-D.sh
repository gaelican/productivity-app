#!/bin/bash
# Solution D: Template reset - Reset to RN 0.73.6 template and re-add features

echo "=== Applying Solution D: Template Reset ==="

# Backup current files
echo "Backing up current configuration..."
mkdir -p android_backup
cp -r android/* android_backup/ 2>/dev/null || true

# Download RN 0.73.6 template files
echo "Downloading React Native 0.73.6 template..."
TEMPLATE_URL="https://raw.githubusercontent.com/react-native-community/react-native-template/0.73.6"

# Create template directory structure
mkdir -p android/app/src/main/java/com/productivityapp
mkdir -p android/app/src/main/res/values

# Download template gradle files
curl -s "${TEMPLATE_URL}/template/android/build.gradle" > android/build.gradle
curl -s "${TEMPLATE_URL}/template/android/settings.gradle" > android/settings.gradle
curl -s "${TEMPLATE_URL}/template/android/gradle.properties" > android/gradle.properties
curl -s "${TEMPLATE_URL}/template/android/app/build.gradle" > android/app/build.gradle

# Update package name in downloaded files
sed -i 's/com\.helloworld/com.productivityapp/g' android/app/build.gradle
sed -i 's/HelloWorld/productivityapp/g' android/settings.gradle

# Create Java files with correct package
cat > android/app/src/main/java/com/productivityapp/MainApplication.java << 'EOF'
package com.productivityapp;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
  }
}
EOF

cat > android/app/src/main/java/com/productivityapp/MainActivity.java << 'EOF'
package com.productivityapp;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

  @Override
  protected String getMainComponentName() {
    return "productivityapp";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }
}
EOF

# Create AndroidManifest.xml
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme">
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
    </application>
</manifest>
EOF

# Create strings.xml
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">productivityapp</string>
</resources>
EOF

# Create styles.xml
cat > android/app/src/main/res/values/styles.xml << 'EOF'
<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
        <!-- Customize your theme here. -->
        <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    </style>
</resources>
EOF

# Fix gradle wrapper
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Add our custom dependencies back
cat >> android/app/build.gradle << 'EOF'

// Re-add our custom dependencies
dependencies {
    // AsyncStorage
    implementation project(':@react-native-async-storage_async-storage')
    
    // React Navigation dependencies
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
}
EOF

echo "Solution D applied successfully!"
#!/bin/bash
# Solution B: Stub/Mock AsyncStorage - Remove all AsyncStorage exclusion logic and stub it

echo "=== Applying Solution B: Stub/Mock AsyncStorage ==="

# Create AsyncStorage stub
mkdir -p android/app/src/main/java/com/productivityapp/stubs

cat > android/app/src/main/java/com/productivityapp/stubs/AsyncStorageStub.java << 'EOF'
package com.productivityapp.stubs;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class AsyncStorageStub extends ReactContextBaseJavaModule {
    public AsyncStorageStub(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNCAsyncStorage";
    }

    @ReactMethod
    public void multiGet(ReadableArray keys, Callback callback) {
        WritableMap error = null;
        WritableMap result = Arguments.createMap();
        callback.invoke(error, result);
    }

    @ReactMethod
    public void multiSet(ReadableArray kvPairs, Callback callback) {
        WritableMap error = null;
        callback.invoke(error);
    }

    @ReactMethod
    public void multiRemove(ReadableArray keys, Callback callback) {
        WritableMap error = null;
        callback.invoke(error);
    }

    @ReactMethod
    public void clear(Callback callback) {
        WritableMap error = null;
        callback.invoke(error);
    }

    @ReactMethod
    public void getAllKeys(Callback callback) {
        WritableMap error = null;
        WritableMap result = Arguments.createMap();
        callback.invoke(error, result);
    }
}
EOF

# Create stub package
cat > android/app/src/main/java/com/productivityapp/stubs/AsyncStoragePackage.java << 'EOF'
package com.productivityapp.stubs;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AsyncStoragePackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AsyncStorageStub(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
EOF

# Update MainApplication.java to use stub
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
import com.productivityapp.stubs.AsyncStoragePackage;
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
          // Remove AsyncStorage if it exists and add our stub
          packages.removeIf(pkg -> pkg.getClass().getName().contains("AsyncStorage"));
          packages.add(new AsyncStoragePackage());
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

# Update build.gradle to remove AsyncStorage exclusions
cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
    hermesCommand = "../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
    codegenDir = file("../../node_modules/@react-native/codegen")
}

def enableProguardInReleaseBuilds = false
def jscFlavor = 'org.webkit:android-jsc:+'

android {
    ndkVersion "25.1.8937393"
    buildToolsVersion = "34.0.0"
    compileSdk 34

    namespace "com.productivityapp"
    
    defaultConfig {
        applicationId "com.productivityapp"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
EOF

# Create JS stub for AsyncStorage
cat > src/utils/AsyncStorageStub.js << 'EOF'
const AsyncStorageStub = {
  setItem: async (key, value) => Promise.resolve(),
  getItem: async (key) => Promise.resolve(null),
  removeItem: async (key) => Promise.resolve(),
  clear: async () => Promise.resolve(),
  getAllKeys: async () => Promise.resolve([]),
  multiGet: async (keys) => Promise.resolve([]),
  multiSet: async (kvPairs) => Promise.resolve(),
  multiRemove: async (keys) => Promise.resolve(),
};

export default AsyncStorageStub;
EOF

echo "Solution B applied successfully!"
#!/usr/bin/env node
// Fix various library issues for Android Gradle Plugin 8.x

const fs = require('fs');
const path = require('path');

// Fix WatermelonDB namespace
const watermelonBuildGradle = path.join(
  __dirname,
  '../node_modules/@nozbe/watermelondb/native/android/build.gradle'
);

if (fs.existsSync(watermelonBuildGradle)) {
  let content = fs.readFileSync(watermelonBuildGradle, 'utf8');
  
  // Check if namespace is already added
  if (!content.includes('namespace ')) {
    // Add namespace after android { block
    content = content.replace(
      /android\s*{/,
      'android {\n    namespace "com.nozbe.watermelondb"'
    );
    
    fs.writeFileSync(watermelonBuildGradle, content);
    console.log('✅ Fixed WatermelonDB namespace');
  } else {
    console.log('✅ WatermelonDB namespace already set');
  }
}

// Fix react-native-community/datetimepicker buildConfig
const datetimepickerBuildGradle = path.join(
  __dirname,
  '../node_modules/@react-native-community/datetimepicker/android/build.gradle'
);

if (fs.existsSync(datetimepickerBuildGradle)) {
  let content = fs.readFileSync(datetimepickerBuildGradle, 'utf8');
  
  // Check if buildFeatures is already added
  if (!content.includes('buildFeatures')) {
    // Add buildFeatures after android { block
    content = content.replace(
      /android\s*{/,
      'android {\n    buildFeatures {\n        buildConfig true\n    }'
    );
    
    fs.writeFileSync(datetimepickerBuildGradle, content);
    console.log('✅ Fixed DateTimePicker buildConfig');
  } else {
    console.log('✅ DateTimePicker buildConfig already set');
  }
}

// Fix AsyncStorage autolinking issue
const asyncStoragePath = path.join(
  __dirname,
  '../node_modules/@react-native-async-storage/async-storage/android'
);

if (fs.existsSync(asyncStoragePath)) {
  // Create a local.properties file to help with module resolution
  const localPropertiesPath = path.join(asyncStoragePath, 'local.properties');
  if (!fs.existsSync(localPropertiesPath)) {
    fs.writeFileSync(localPropertiesPath, 'sdk.dir=/usr/local/lib/android/sdk\n');
    console.log('✅ Created local.properties for AsyncStorage');
  }
  
  // Check if build.gradle exists and has proper configuration
  const asyncStorageBuildGradle = path.join(asyncStoragePath, 'build.gradle');
  if (fs.existsSync(asyncStorageBuildGradle)) {
    let content = fs.readFileSync(asyncStorageBuildGradle, 'utf8');
    
    // Ensure namespace is set
    if (!content.includes('namespace ')) {
      content = content.replace(
        /android\s*{/,
        'android {\n    namespace "com.reactnativecommunity.asyncstorage"'
      );
      fs.writeFileSync(asyncStorageBuildGradle, content);
      console.log('✅ Fixed AsyncStorage namespace');
    }
  }
}

// Fix react-native.config.js to exclude problematic modules
const rnConfigPath = path.join(__dirname, '../react-native.config.js');
if (fs.existsSync(rnConfigPath)) {
  const newConfig = `module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    // Fix AsyncStorage autolinking
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-async-storage/async-storage/android',
          packageImportPath: 'import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;',
        },
      },
    },
  },
};
`;
  fs.writeFileSync(rnConfigPath, newConfig);
  console.log('✅ Updated react-native.config.js');
}

// Add more library fixes as needed
console.log('✅ Library fixes completed');
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

// Add more library fixes as needed
console.log('✅ Library fixes completed');
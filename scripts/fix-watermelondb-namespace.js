#!/usr/bin/env node
// Fix WatermelonDB namespace issue for Android Gradle Plugin 8.x

const fs = require('fs');
const path = require('path');

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
} else {
  console.log('⚠️  WatermelonDB build.gradle not found');
}
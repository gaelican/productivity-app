#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Patching React Native autolinking to exclude AsyncStorage...');

// Find the native_modules.gradle file
const nativeModulesPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-community',
  'cli-platform-android',
  'native_modules.gradle'
);

if (fs.existsSync(nativeModulesPath)) {
  let content = fs.readFileSync(nativeModulesPath, 'utf8');
  
  // Check if already patched
  if (!content.includes('ASYNC_STORAGE_PATCH')) {
    console.log('📝 Patching native_modules.gradle...');
    
    // Find the section where modules are added
    const addModulePattern = /def moduleName = packageJson\.name/;
    
    if (content.match(addModulePattern)) {
      // Insert our filter right after the module name is determined
      const patch = `
        // ASYNC_STORAGE_PATCH: Skip AsyncStorage modules
        if (moduleName.contains('async-storage') || moduleName.contains('async_storage')) {
          logger.info("[:AsyncStorage] Skipping module: {}", moduleName)
          return
        }
        // END ASYNC_STORAGE_PATCH
      `;
      
      content = content.replace(
        /def moduleName = packageJson\.name/,
        'def moduleName = packageJson.name' + patch
      );
      
      fs.writeFileSync(nativeModulesPath, content);
      console.log('✅ Successfully patched native_modules.gradle');
    } else {
      console.log('⚠️  Could not find expected pattern in native_modules.gradle');
    }
  } else {
    console.log('✅ native_modules.gradle already patched');
  }
} else {
  console.log('⚠️  native_modules.gradle not found at:', nativeModulesPath);
}

// Also patch expo autolinking if it exists
const expoAutolinkingPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'scripts',
  'autolinking.gradle'
);

if (fs.existsSync(expoAutolinkingPath)) {
  let content = fs.readFileSync(expoAutolinkingPath, 'utf8');
  
  if (!content.includes('ASYNC_STORAGE_PATCH')) {
    console.log('📝 Patching expo autolinking.gradle...');
    
    // Find where expo modules are included
    const includePattern = /include\s*":\$\{moduleName\}"/;
    
    if (content.match(includePattern)) {
      // Wrap the include in a conditional
      content = content.replace(
        /include\s*":\$\{moduleName\}"/g,
        `// ASYNC_STORAGE_PATCH
        if (!moduleName.contains('async-storage') && !moduleName.contains('async_storage')) {
          include ":\${moduleName}"
        } else {
          logger.info("[Expo:AsyncStorage] Skipping module: {}", moduleName)
        }
        // END ASYNC_STORAGE_PATCH`
      );
      
      fs.writeFileSync(expoAutolinkingPath, content);
      console.log('✅ Successfully patched expo autolinking.gradle');
    }
  } else {
    console.log('✅ expo autolinking.gradle already patched');
  }
}

console.log('✨ Autolinking patch complete');
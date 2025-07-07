#!/usr/bin/env node
// Debug React Native autolinking configuration

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging React Native Autolinking\n');

// Check react-native.config.js
const rnConfigPath = path.join(__dirname, '..', 'react-native.config.js');
if (fs.existsSync(rnConfigPath)) {
  console.log('📄 react-native.config.js:');
  const config = require(rnConfigPath);
  console.log(JSON.stringify(config, null, 2));
  console.log();
}

// Run React Native CLI config command
console.log('🔧 Running react-native config...\n');
try {
  const output = execSync('cd .. && npx react-native config', { encoding: 'utf8' });
  const config = JSON.parse(output);
  
  console.log('📦 Dependencies found:');
  Object.keys(config.dependencies || {}).forEach(dep => {
    const depConfig = config.dependencies[dep];
    console.log(`  - ${dep}:`);
    console.log(`    Android: ${depConfig.platforms?.android ? 'Enabled' : 'Disabled'}`);
    if (depConfig.platforms?.android) {
      console.log(`    Source: ${depConfig.platforms.android.sourceDir}`);
    }
  });
} catch (error) {
  console.error('❌ Error running react-native config:', error.message);
}

// Check for generated files
console.log('\n📁 Checking for generated autolinking files...');
const androidBuildDir = path.join(__dirname, '..', 'android', 'build');
const generatedDir = path.join(androidBuildDir, 'generated', 'autolinking');

if (fs.existsSync(generatedDir)) {
  console.log('Found generated autolinking directory');
  const files = fs.readdirSync(generatedDir);
  files.forEach(file => {
    console.log(`  - ${file}`);
  });
}
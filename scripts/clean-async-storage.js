#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Cleaning AsyncStorage references...');

// Remove any AsyncStorage from react-native.config.js if it exists
const configPath = path.join(__dirname, '..', 'react-native.config.js');
if (fs.existsSync(configPath)) {
  let config = fs.readFileSync(configPath, 'utf8');
  if (config.includes('async-storage')) {
    console.log('Found AsyncStorage in react-native.config.js - already disabled');
  }
}

// Check for any package-lock.json references
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  
  // Check if AsyncStorage is in the lock file
  const hasAsyncStorage = Object.keys(packageLock.dependencies || {})
    .some(key => key.includes('async-storage'));
    
  if (hasAsyncStorage) {
    console.log('WARNING: Found AsyncStorage in package-lock.json');
    console.log('Run: npm uninstall @react-native-async-storage/async-storage');
    console.log('Then: rm -rf node_modules package-lock.json && npm install');
  }
}

// Create a dummy package.json for AsyncStorage if needed
const dummyDir = path.join(__dirname, '..', 'node_modules', '@react-native-async-storage', 'async-storage');
if (!fs.existsSync(dummyDir)) {
  fs.mkdirSync(path.dirname(dummyDir), { recursive: true });
  fs.mkdirSync(dummyDir, { recursive: true });
  
  const dummyPackage = {
    name: "@react-native-async-storage/async-storage",
    version: "0.0.0",
    description: "Dummy package to prevent build errors",
    main: "index.js",
    "react-native": {
      platforms: {
        android: null,
        ios: null
      }
    }
  };
  
  fs.writeFileSync(
    path.join(dummyDir, 'package.json'),
    JSON.stringify(dummyPackage, null, 2)
  );
  
  fs.writeFileSync(
    path.join(dummyDir, 'index.js'),
    '// Dummy AsyncStorage module\nmodule.exports = {};'
  );
  
  console.log('Created dummy AsyncStorage package');
}

console.log('Cleanup complete!');
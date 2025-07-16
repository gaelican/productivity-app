#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking for AsyncStorage dependencies...\n');

function checkPackageJson(filePath, packageName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies
    };
    
    for (const [dep, version] of Object.entries(deps)) {
      if (dep.toLowerCase().includes('async-storage') || 
          dep.toLowerCase().includes('async_storage')) {
        console.log(`❌ ${packageName} directly depends on AsyncStorage:`);
        console.log(`   ${dep}: ${version}`);
        return true;
      }
    }
    
    // Check for packages known to use AsyncStorage
    const suspiciousPackages = [
      'redux-persist',
      '@react-native-community/async-storage',
      'react-native-async-storage'
    ];
    
    for (const [dep, version] of Object.entries(deps)) {
      if (suspiciousPackages.includes(dep)) {
        console.log(`⚠️  ${packageName} depends on ${dep} which might use AsyncStorage`);
      }
    }
    
  } catch (error) {
    // Ignore errors
  }
  
  return false;
}

// Check main package.json
console.log('📦 Checking main package.json...');
const hasMainDep = checkPackageJson('./package.json', 'Main project');

// Check all node_modules
console.log('\n📦 Checking node_modules...');
const nodeModulesPath = './node_modules';
let foundTransitive = false;

if (fs.existsSync(nodeModulesPath)) {
  const modules = fs.readdirSync(nodeModulesPath);
  
  for (const moduleName of modules) {
    if (moduleName.startsWith('@')) {
      // Scoped packages
      const scopePath = path.join(nodeModulesPath, moduleName);
      const scopedModules = fs.readdirSync(scopePath);
      
      for (const scopedModule of scopedModules) {
        const pkgJsonPath = path.join(scopePath, scopedModule, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          if (checkPackageJson(pkgJsonPath, `${moduleName}/${scopedModule}`)) {
            foundTransitive = true;
          }
        }
      }
    } else {
      const pkgJsonPath = path.join(nodeModulesPath, moduleName, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        if (checkPackageJson(pkgJsonPath, moduleName)) {
          foundTransitive = true;
        }
      }
    }
  }
}

// Check for AsyncStorage module directly
console.log('\n📁 Checking for AsyncStorage module presence...');
const asyncStoragePaths = [
  './node_modules/@react-native-async-storage/async-storage',
  './node_modules/@react-native-community/async-storage',
  './node_modules/react-native-async-storage'
];

for (const asyncPath of asyncStoragePaths) {
  if (fs.existsSync(asyncPath)) {
    console.log(`❌ Found AsyncStorage module at: ${asyncPath}`);
    
    // Check if it's our dummy module
    const dummyFile = path.join(asyncPath, '.dummy');
    if (fs.existsSync(dummyFile)) {
      console.log('   ✅ This is our dummy module');
    } else {
      console.log('   ❌ This is a real AsyncStorage module!');
    }
  }
}

// Summary
console.log('\n📊 Summary:');
if (!hasMainDep && !foundTransitive) {
  console.log('✅ No direct AsyncStorage dependencies found');
} else {
  console.log('❌ AsyncStorage dependencies detected - see above for details');
}

// Check WatermelonDB specifically
console.log('\n🍉 Checking WatermelonDB configuration...');
const watermelonPath = './node_modules/@nozbe/watermelondb/package.json';
if (fs.existsSync(watermelonPath)) {
  const watermelonPkg = JSON.parse(fs.readFileSync(watermelonPath, 'utf8'));
  console.log('WatermelonDB version:', watermelonPkg.version);
  checkPackageJson(watermelonPath, 'WatermelonDB');
}
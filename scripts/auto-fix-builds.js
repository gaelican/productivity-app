#!/usr/bin/env node
// Automated Android Build Fix System

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_ATTEMPTS = 10;

// Fix functions
const fixes = {
  // Fix namespace issues
  fixNamespace: (moduleName, namespace) => {
    console.log(`🔧 Fixing namespace for ${moduleName}`);
    const buildGradlePath = path.join(__dirname, '..', 'node_modules', moduleName, 'android', 'build.gradle');
    
    if (fs.existsSync(buildGradlePath)) {
      let content = fs.readFileSync(buildGradlePath, 'utf8');
      if (!content.includes('namespace ')) {
        content = content.replace(
          /android\s*{/,
          `android {\n    namespace "${namespace}"`
        );
        fs.writeFileSync(buildGradlePath, content);
        return true;
      }
    }
    return false;
  },

  // Fix buildConfig issues
  fixBuildConfig: (moduleName) => {
    console.log(`🔧 Fixing buildConfig for ${moduleName}`);
    const buildGradlePath = path.join(__dirname, '..', 'node_modules', moduleName, 'android', 'build.gradle');
    
    if (fs.existsSync(buildGradlePath)) {
      let content = fs.readFileSync(buildGradlePath, 'utf8');
      if (!content.includes('buildFeatures')) {
        content = content.replace(
          /android\s*{/,
          'android {\n    buildFeatures {\n        buildConfig true\n    }'
        );
        fs.writeFileSync(buildGradlePath, content);
        return true;
      }
    }
    return false;
  },

  // Fix AsyncStorage module name issue
  fixAsyncStorage: () => {
    console.log('🔧 Fixing AsyncStorage module configuration');
    const settingsGradlePath = path.join(__dirname, '..', 'android', 'settings.gradle');
    
    if (fs.existsSync(settingsGradlePath)) {
      let content = fs.readFileSync(settingsGradlePath, 'utf8');
      
      // Replace incorrect module name
      content = content.replace(
        /include\s*['"]:react-native-async-storage_async-storage['"]/g,
        "include ':@react-native-async-storage_async-storage'"
      );
      
      // Add project configuration if missing
      if (!content.includes("project(':@react-native-async-storage_async-storage').projectDir")) {
        content += "\n\n// AsyncStorage project configuration\n";
        content += "project(':@react-native-async-storage_async-storage').projectDir = new File(rootProject.projectDir, '../node_modules/@react-native-async-storage/async-storage/android')\n";
      }
      
      fs.writeFileSync(settingsGradlePath, content);
      return true;
    }
    return false;
  },

  // Add missing repositories
  addRepositories: () => {
    console.log('🔧 Adding missing repositories');
    const buildGradlePath = path.join(__dirname, '..', 'android', 'build.gradle');
    
    if (fs.existsSync(buildGradlePath)) {
      let content = fs.readFileSync(buildGradlePath, 'utf8');
      
      // Ensure all required repositories are present
      const requiredRepos = [
        'google()',
        'mavenCentral()',
        'maven { url "https://www.jitpack.io" }'
      ];
      
      let modified = false;
      requiredRepos.forEach(repo => {
        if (!content.includes(repo)) {
          content = content.replace(
            /repositories\s*{/g,
            `repositories {\n        ${repo}`
          );
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(buildGradlePath, content);
        return true;
      }
    }
    return false;
  }
};

// Error pattern matching
const errorPatterns = [
  {
    pattern: /namespace not specified.*?project\s+['":]([^'":\s]+)['":]?/i,
    fix: (match) => {
      const moduleName = match[1].replace(/^:/, '');
      const namespace = moduleName.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase();
      return fixes.fixNamespace(moduleName, `com.${namespace}`);
    }
  },
  {
    pattern: /buildFeatures\.buildConfig.*?project\s+['":]([^'":\s]+)['":]?/i,
    fix: (match) => {
      const moduleName = match[1].replace(/^:/, '');
      return fixes.fixBuildConfig(moduleName);
    }
  },
  {
    pattern: /Could not resolve project :react-native-async-storage_async-storage/i,
    fix: () => fixes.fixAsyncStorage()
  },
  {
    pattern: /Could not find ([^:]+):([^:]+):([^.]+)/i,
    fix: () => fixes.addRepositories()
  }
];

// Execute command and return output
function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.stderr || error.toString();
  }
}

// Check build status
async function checkBuildStatus() {
  const runs = exec('gh run list --limit 1 --json status,conclusion,databaseId');
  const run = JSON.parse(runs)[0];
  
  return {
    id: run.databaseId,
    status: run.status,
    conclusion: run.conclusion
  };
}

// Get build logs
async function getBuildLogs(runId) {
  return exec(`gh run view ${runId} --log-failed 2>/dev/null || echo ""`);
}

// Apply fixes based on error patterns
async function applyFixes(logs) {
  let fixesApplied = false;
  
  for (const { pattern, fix } of errorPatterns) {
    const match = logs.match(pattern);
    if (match) {
      console.log(`📍 Found error pattern: ${pattern}`);
      if (fix(match)) {
        fixesApplied = true;
      }
    }
  }
  
  return fixesApplied;
}

// Commit and push fixes
async function commitAndPush(message) {
  console.log('📤 Committing and pushing fixes...');
  exec('git add -A');
  exec(`git commit -m "${message}\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"`);
  exec('git push');
}

// Main monitoring loop
async function monitorAndFix() {
  let attempts = 0;
  
  console.log('🤖 Android Build Auto-Fix System Started');
  console.log('=' .repeat(50));
  
  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`\n🔄 Check #${attempts} at ${new Date().toLocaleTimeString()}`);
    
    try {
      const status = await checkBuildStatus();
      console.log(`📊 Build ${status.id}: ${status.status}`);
      
      if (status.status === 'completed') {
        if (status.conclusion === 'success') {
          console.log('✅ Build succeeded! 🎉');
          console.log('📦 Download APK: gh run download -n app-debug');
          break;
        } else if (status.conclusion === 'failure') {
          console.log('❌ Build failed, analyzing logs...');
          
          const logs = await getBuildLogs(status.id);
          const fixesApplied = await applyFixes(logs);
          
          if (fixesApplied) {
            await commitAndPush('Fix: Auto-fix Android build issues');
            console.log('✅ Fixes applied and pushed');
          } else {
            console.log('⚠️  No automatic fixes available');
            console.log('📋 Error summary:');
            const errorLines = logs.split('\n').filter(line => 
              line.includes('FAILURE:') || 
              line.includes('What went wrong:') ||
              line.includes('> ')
            ).slice(0, 10);
            errorLines.forEach(line => console.log(`   ${line.trim()}`));
          }
        }
      }
      
      // Wait before next check
      if (attempts < MAX_ATTEMPTS) {
        console.log(`⏳ Waiting ${CHECK_INTERVAL/1000}s before next check...`);
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('\n🏁 Auto-fix system completed');
}

// Run the system
if (require.main === module) {
  monitorAndFix().catch(console.error);
}

module.exports = { fixes, errorPatterns };
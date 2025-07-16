#!/usr/bin/env node
// Monitor builds until success

const { execSync } = require('child_process');
const fs = require('fs');

const CHECK_INTERVAL = 20000; // 20 seconds
let buildCount = 0;
let startTime = Date.now();

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.stderr || error.toString();
  }
}

function sendNotification(title, content) {
  try {
    exec(`termux-notification --title "${title}" --content "${content}" --vibrate 200`);
  } catch (e) {
    // Ignore notification errors
  }
}

async function monitorBuilds() {
  console.log('🤖 Monitoring Android builds until success');
  console.log('=' .repeat(50));
  
  while (true) {
    buildCount++;
    const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
    
    const runs = exec('gh run list --limit 1 --json status,conclusion,databaseId,headBranch');
    const run = JSON.parse(runs)[0];
    
    if (!run) {
      console.log('❌ No builds found');
      break;
    }
    
    console.log(`\n🔄 Check #${buildCount} at ${new Date().toLocaleTimeString()}`);
    console.log(`📊 Build ${run.databaseId}: ${run.status}`);
    console.log(`⏱️  Elapsed: ${elapsedMinutes} minutes`);
    
    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        console.log('\n✅ BUILD SUCCEEDED! 🎉');
        console.log('📦 Download APK: gh run download -n app-debug');
        
        sendNotification(
          '✅ Android Build Succeeded!',
          `Build completed successfully after ${buildCount} attempts in ${elapsedMinutes} minutes. APK is ready for download.`
        );
        
        // Show download instructions
        console.log('\n📥 To download the APK:');
        console.log('1. Run: gh run download -n app-debug');
        console.log('2. Or visit: https://github.com/gaelican/productivity-app/actions');
        console.log('3. Install: termux-open app-debug.apk');
        
        break;
      } else if (run.conclusion === 'failure') {
        console.log('❌ Build failed');
        
        // Get error summary
        const logs = exec(`gh run view ${run.databaseId} --log-failed | grep -A5 "What went wrong" | head -20`);
        console.log('\n📋 Error summary:');
        console.log(logs);
        
        sendNotification(
          '❌ Build Failed',
          `Build #${buildCount} failed. Waiting for next build...`
        );
      }
    }
    
    // Wait before next check
    console.log(`⏳ Next check in ${CHECK_INTERVAL/1000}s...`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  console.log(`\n🏁 Monitoring completed after ${buildCount} checks`);
}

// Start monitoring
monitorBuilds().catch(console.error);
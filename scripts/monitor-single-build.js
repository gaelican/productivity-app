#!/usr/bin/env node
// Monitor a single build and show progress

const { execSync } = require('child_process');

const buildId = process.argv[2] || '';
const checkInterval = 15000; // 15 seconds

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.stderr || error.toString();
  }
}

async function monitorBuild() {
  let lastStatus = '';
  
  console.log(`🔍 Monitoring build ${buildId}`);
  console.log('─'.repeat(50));
  
  while (true) {
    const result = exec(`gh run view ${buildId} --json status,conclusion,jobs`);
    const data = JSON.parse(result);
    
    if (data.status !== lastStatus) {
      console.log(`\n⏰ ${new Date().toLocaleTimeString()}`);
      console.log(`📊 Status: ${data.status}`);
      
      if (data.jobs && data.jobs.length > 0) {
        const job = data.jobs[0];
        const steps = job.steps || [];
        const completed = steps.filter(s => s.conclusion === 'success').length;
        const failed = steps.filter(s => s.conclusion === 'failure').length;
        const running = steps.filter(s => s.status === 'in_progress').length;
        
        console.log(`📋 Steps: ${completed}✓ ${running}⏳ ${failed}✗ / ${steps.length}`);
        
        if (running > 0) {
          const runningStep = steps.find(s => s.status === 'in_progress');
          console.log(`🔄 Running: ${runningStep.name}`);
        }
      }
      
      lastStatus = data.status;
    }
    
    if (data.status === 'completed') {
      console.log(`\n✅ Build completed: ${data.conclusion}`);
      
      if (data.conclusion === 'failure') {
        console.log('\n❌ Build failed! Getting error logs...\n');
        const logs = exec(`gh run view ${buildId} --log-failed | tail -50`);
        console.log(logs);
      } else if (data.conclusion === 'success') {
        console.log('\n🎉 Build succeeded!');
        console.log('📦 Download APK: gh run download -n app-debug');
      }
      
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
}

if (!buildId) {
  // Get latest build
  const runs = exec('gh run list --limit 1 --json databaseId');
  const latestRun = JSON.parse(runs)[0];
  if (latestRun) {
    process.argv[2] = latestRun.databaseId;
  }
}

monitorBuild().catch(console.error);
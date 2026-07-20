const Watcher = require('./src/core/watcher');
const fs = require('fs-extra');
const path = require('path');

async function testSync() {
  const testRepo = path.join(__dirname, 'test-repo-sync');
  await fs.ensureDir(testRepo);
  
  // Make sure it's a git repo
  const { execSync } = require('child_process');
  try {
    execSync('git init', { cwd: testRepo });
    // Write a dummy config
    await fs.writeJson(path.join(testRepo, '.autopilotrc.json'), {
      debounceMs: 5000,
      autoPush: false
    });
  } catch (e) {
    console.error('Git init failed, but continuing test...');
  }

  console.log('Starting Watcher in:', testRepo);
  const watcher = new Watcher(testRepo);
  
  // Patch git to avoid actual commits if possible or just let it fail silently
  // Actually, we just want to see the state file.
  
  await watcher.start();
  
  console.log('Watcher started. Checking for .autopilot-state.json...');
  
  // Check every 2s for 10s
  for(let i=0; i<5; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statePath = path.join(testRepo, '.autopilot-state.json');
    if (fs.existsSync(statePath)) {
      const state = fs.readJsonSync(statePath);
      console.log(`Poll ${i+1}: Status=${state.status}, Uptime=${state.uptime}s, Queue=${state.queueLength}`);
      // Check for log file
      const logPath = path.join(testRepo, '.autopilot.log');
      if (fs.existsSync(logPath)) {
        console.log(`- .autopilot.log exists!`);
      }
    } else {
      console.log(`Poll ${i+1}: .autopilot-state.json not found yet`);
    }
  }
  
  await watcher.stop();
  console.log('Watcher stopped. Checking cleanup...');
  const statePath = path.join(testRepo, '.autopilot-state.json');
  if (!fs.existsSync(statePath)) {
    console.log('✅ State file cleaned up.');
  } else {
    console.error('❌ State file still exists!');
  }
  
  const logPath = path.join(testRepo, '.autopilot.log');
  if (!fs.existsSync(logPath)) {
     console.log('✅ Log file cleaned up.');
  } else {
     console.error('❌ Log file still exists!');
  }
}

testSync().catch(console.error);

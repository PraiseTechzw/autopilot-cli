import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../bin/autopilot.js');

console.log('Running dashboard check...');

const child = spawn('node', [binPath, 'dashboard'], {
  stdio: 'pipe',
  timeout: 5000,
  env: { ...process.env, AUTOPILOT_TEST_MODE: '1' }
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

child.on('close', (code) => {
  console.log('Output:', output);
  console.log('Error:', errorOutput);
  if (code !== 0 && code !== null) { // code is null if killed by timeout
    console.error(`Dashboard exited with code ${code}`);
    process.exit(1);
  } else {
    console.log('Dashboard started successfully (killed by timeout)');
    process.exit(0);
  }
});

// Kill it after 3 seconds
setTimeout(() => {
  child.kill();
}, 3000);

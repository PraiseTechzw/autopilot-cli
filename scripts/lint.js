#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const roots = ['bin', 'src', 'scripts', 'test'];
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (/\.m?js$/.test(entry.name)) files.push(fullPath);
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) collect(root);
}

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) process.exitCode = 1;
else console.log(`Syntax checked ${files.length} JavaScript files.`);

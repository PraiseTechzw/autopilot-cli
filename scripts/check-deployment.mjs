#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const siteUrl = (process.env.SITE_URL || 'https://autopilot-cli.vercel.app').replace(/\/$/, '');
const checks = [
  { path: '/', content: 'Autopilot CLI' },
  { path: '/docs', content: 'Documentation' },
  { path: '/robots.txt', content: 'Sitemap:' },
  { path: '/sitemap.xml', content: '<urlset' },
];

const failures = [];
const results = [];

for (const check of checks) {
  const url = `${siteUrl}${check.path}`;
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    const passed = response.ok && body.includes(check.content);
    results.push({ url, status: response.status, passed });
    if (!passed) failures.push(`${url} returned ${response.status} or missing expected content`);
  } catch (error) {
    results.push({ url, passed: false, error: error.message });
    failures.push(`${url} failed: ${error.message}`);
  }
}

const syncUrl = `${siteUrl}/api/leaderboard/sync`;
try {
  // An empty payload must be rejected by the route; 404 means the route is not deployed.
  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  const passed = response.status === 400 && body.includes('Missing required fields');
  results.push({ url: syncUrl, status: response.status, passed });
  if (!passed) failures.push(`${syncUrl} returned ${response.status} or did not validate an empty payload`);
} catch (error) {
  results.push({ url: syncUrl, passed: false, error: error.message });
  failures.push(`${syncUrl} failed: ${error.message}`);
}

const packagePath = path.resolve('vscode-extension/package.json');
try {
  const manifest = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  const valid = manifest.name === 'praisetechzw-autopilot' && manifest.publisher === 'PraiseTechzw' && manifest.main === './extension.js';
  results.push({ check: 'VS Code extension manifest', name: manifest.name, version: manifest.version, passed: valid });
  if (!valid) failures.push('VS Code extension manifest identity or entry point is invalid');
} catch (error) {
  failures.push(`VS Code extension manifest failed: ${error.message}`);
}

console.log(JSON.stringify({ siteUrl, checkedAt: new Date().toISOString(), passed: failures.length === 0, results, failures }, null, 2));
if (failures.length) process.exit(1);

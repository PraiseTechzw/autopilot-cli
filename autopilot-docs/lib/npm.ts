import path from 'path';
import fs from 'fs';

export async function getLatestVersion(): Promise<string | null> {
  // 1. Try to read local package.json (Source of Truth for the repo)
  try {
    // In dev/build, process.cwd() is usually the project root (autopilot-docs)
    // We want the parent root's package.json
    const localPackagePath = path.resolve(process.cwd(), '../package.json');
    if (fs.existsSync(localPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(localPackagePath, 'utf8'));
      if (pkg.name === '@traisetech/autopilot') {
        return pkg.version;
      }
    }
  } catch (error) {
    // Silently fail and fall back to NPM
  }

  // 2. Fallback to NPM registry (for production/standalone deployments)
  try {
    const res = await fetch('https://registry.npmjs.org/@traisetech/autopilot/latest', {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.version;
  } catch (error) {
    console.error('Failed to fetch package version:', error);
    return null;
  }
}

export async function getWeeklyDownloads(): Promise<number | null> {
  try {
    const res = await fetch('https://api.npmjs.org/downloads/point/last-week/@traisetech/autopilot', {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.downloads;
  } catch (error) {
    console.error('Failed to fetch package downloads:', error);
    return null;
  }
}

export async function getTotalDownloads(): Promise<number | null> {
  try {
    const start = '2024-01-01';
    const end = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.npmjs.org/downloads/range/${start}:${end}/@traisetech/autopilot`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    if (data.downloads && Array.isArray(data.downloads)) {
      return data.downloads.reduce((acc: number, day: { downloads: number }) => acc + day.downloads, 0);
    }
    return 0;
  } catch (error) {
    console.error('Failed to fetch total downloads:', error);
    return null;
  }
}

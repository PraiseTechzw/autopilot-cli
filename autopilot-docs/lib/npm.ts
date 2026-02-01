export async function getLatestVersion(): Promise<string | null> {
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

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

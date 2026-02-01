import { getLatestVersion } from '@/lib/npm';

export async function VersionBadge() {
  const version = await getLatestVersion();
  const displayVersion = version ? `v${version}` : 'v—';

  return (
    <div className="hidden md:flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
      {displayVersion}
    </div>
  );
}

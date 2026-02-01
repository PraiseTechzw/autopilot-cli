import { getLatestVersion } from '@/lib/npm';

export async function VersionBadge() {
  const version = await getLatestVersion();
  const displayVersion = version ? `v${version}` : 'v—';

  return (
    <div className="hidden md:flex items-center px-2.5 py-0.5 rounded-full bg-link/10 text-xs font-semibold text-link border border-link/20">
      {displayVersion}
    </div>
  );
}

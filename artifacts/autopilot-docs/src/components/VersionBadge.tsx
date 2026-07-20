import { useEffect, useState } from 'react';

export function VersionBadge() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(r => r.json())
      .then(d => setVersion(d.version))
      .catch(() => {
        fetch('https://registry.npmjs.org/@traisetech/autopilot/latest')
          .then(r => r.json())
          .then(d => setVersion(d.version))
          .catch(() => {});
      });
  }, []);

  const displayVersion = version ? `v${version}` : 'v4.0.2';

  return (
    <div className="hidden md:flex items-center px-2.5 py-0.5 rounded-full bg-link/10 text-xs font-semibold text-link border border-link/20">
      {displayVersion}
    </div>
  );
}

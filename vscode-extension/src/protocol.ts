export type ErrorKind = 'not-found' | 'version' | 'auth' | 'git' | 'provider' | 'command';

export function buildCliArgs(args: string[], json = false, ai = false): string[] {
  return [...args, ...(json ? ['--json'] : []), ...(ai ? ['--ai'] : [])];
}

export function parseJson<T>(stdout: string, command: string): T {
  try { return JSON.parse(stdout) as T; }
  catch { throw new Error(`Autopilot returned invalid JSON for: ${command}`); }
}

export function versionAtLeast(actual: string, minimum: string): boolean {
  const parse = (value: string) => value.trim().replace(/^v/, '').split('.').map(Number);
  const a = parse(actual); const m = parse(minimum);
  return !a.some(Number.isNaN) && !m.some(Number.isNaN) && (a[0] > m[0] || (a[0] === m[0] && (a[1] > m[1] || (a[1] === m[1] && a[2] >= m[2]))));
}

export function classifyError(text: string): ErrorKind {
  if (/GITHUB_TOKEN|GH_TOKEN|authentication|unauthorized/i.test(text)) return 'auth';
  if (/provider|OPENROUTER|AI_API_KEY/i.test(text)) return 'provider';
  if (/git|repository|working tree/i.test(text)) return 'git';
  return 'command';
}

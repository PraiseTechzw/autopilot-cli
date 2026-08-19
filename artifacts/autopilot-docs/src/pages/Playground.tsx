import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Activity, Copy, GitCommit, Laptop, Play, Terminal, Trophy } from 'lucide-react';

type Commit = { hash: string; message: string; author: string; timestamp: string; branch: string; diff?: string };
type Machine = { hostname?: string; repoName?: string; repoPath?: string; branch?: string; status?: string; commits?: Commit[]; metrics?: { focusMinutes?: number; commitsCount?: number; streak?: number } };
type Line = { id: string; text: string; kind: 'info' | 'success' | 'error' | 'command' };
const line = (kind: Line['kind'], text: string): Line => ({ id: crypto.randomUUID(), kind, text });

export default function PlaygroundPage() {
  const initialCode = new URLSearchParams(window.location.search).get('code')?.toUpperCase() || '';
  const [code, setCode] = useState(initialCode); const [sessionCode, setSessionCode] = useState(initialCode);
  const [connected, setConnected] = useState(false); const [machine, setMachine] = useState<Machine | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]); const [changes, setChanges] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null); const [command, setCommand] = useState('');
  const [github, setGithub] = useState<{ connected: boolean; login: string | null }>({ connected: false, login: null });
  const [lines, setLines] = useState<Line[]>([line('info', 'Pair a local Autopilot CLI to see real commits and watcher activity.')]);
  const add = (...items: Line[]) => setLines(current => [...current, ...items]);
  const updateMachine = (next: Machine | null) => { if (next) { setMachine(next); if (next.commits) setCommits(next.commits); } };

  const createSession = async (requested = code) => {
    const normalized = requested.trim().toUpperCase(); if (!normalized) return;
    try {
      const response = await fetch('/api/bridge/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: normalized }) });
      if (!response.ok) throw new Error('Could not create pairing session'); const data = await response.json();
      setCode(data.code); setSessionCode(data.code); setConnected(Boolean(data.paired)); updateMachine(data.machineInfo);
      window.history.replaceState(null, '', `/playground?code=${encodeURIComponent(data.code)}`);
      add(line('info', `Pairing session ${data.code} is ready.`));
    } catch (error) { add(line('error', error instanceof Error ? error.message : 'API connection failed')); }
  };
  useEffect(() => { if (sessionCode) void createSession(sessionCode); }, []);
  useEffect(() => {
    if (!sessionCode) return; const source = new EventSource(`/api/bridge/stream/${encodeURIComponent(sessionCode)}`);
    const read = (event: Event) => JSON.parse((event as MessageEvent).data);
    source.addEventListener('init', event => { const data = read(event); setConnected(Boolean(data.paired)); updateMachine(data.machineInfo); });
    source.addEventListener('paired', event => { const data = read(event); setConnected(true); updateMachine(data.machineInfo); add(line('success', `Connected to ${data.machineInfo?.repoName || data.machineInfo?.hostname || 'your CLI'}.`)); });
    source.addEventListener('file_change', event => { const { payload } = read(event); if (payload?.filePath) setChanges(current => Array.from(new Set([...current, payload.filePath]))); add(line('info', `[watcher] ${payload?.type || 'change'} ${payload?.filePath || ''}`)); });
    source.addEventListener('debounce_tick', event => setCountdown(read(event).payload?.secondsLeft ?? null));
    source.addEventListener('commit', event => { const commit = read(event).payload as Commit; setCommits(current => [commit, ...current.filter(item => item.hash !== commit.hash)]); setChanges([]); setCountdown(null); add(line('success', `[${commit.hash}] ${commit.message}`)); });
    source.addEventListener('status_update', event => { const { payload } = read(event); setMachine(current => ({ ...current, status: payload?.status || current?.status })); });
    source.addEventListener('command_result', event => { const data = read(event); add(line(data.exitCode === 0 ? 'success' : 'error', data.output || data.error || `${data.command} finished`)); });
    source.onerror = () => setConnected(false); return () => source.close();
  }, [sessionCode]);
  useEffect(() => {
    if (!sessionCode) return;
    const loadGithub = async () => {
      try { const response = await fetch(`/api/github/status/${encodeURIComponent(sessionCode)}`); if (response.ok) setGithub(await response.json()); } catch { /* GitHub is optional */ }
    };
    void loadGithub();
  }, [sessionCode]);
  const run = async () => {
    const text = command.trim(); if (!text || !sessionCode) return; add(line('command', `$ ${text}`)); setCommand('');
    if (!connected) { add(line('error', 'No CLI is connected. Run the pairing command first.')); return; }
    const [program, ...rest] = text.split(/\s+/); const cliCommand = program === 'autopilot' ? rest.shift() : program;
    try { const response = await fetch(`/api/bridge/command/${encodeURIComponent(sessionCode)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: cliCommand, args: rest }) }); if (!response.ok) throw new Error('Command dispatch failed'); add(line('info', 'Command sent to your local CLI.')); } catch (error) { add(line('error', error instanceof Error ? error.message : 'Command dispatch failed')); }
  };
  const apiUrl = window.location.origin.replace(/:\d+$/, ':5000'); const pair = `autopilot connect ${sessionCode || '<PAIRING-CODE>'} --api ${apiUrl} --web-url ${window.location.origin} --start`;
  const metric = machine?.metrics || {};
  return <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8"><div className="mx-auto max-w-6xl space-y-5">
    <section className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><Laptop className="h-6 w-6 text-link" /><div><h1 className="text-xl font-black">Live Autopilot Dashboard</h1><p className="text-sm text-muted-foreground">A real paired CLI connection—never a browser simulator.</p></div></div><span className={connected ? 'text-emerald-400' : 'text-amber-400'}>{connected ? '● CLI CONNECTED' : '● AWAITING PAIRING'}</span></div><div className="mt-4 flex gap-2"><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Pairing code (e.g. AP-1234)" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm" /><button onClick={() => void createSession()} className="rounded-xl bg-link px-4 py-2 text-sm font-bold text-black">Open session</button></div>{sessionCode && <div className="mt-4 rounded-xl bg-link/10 p-3 text-sm"><p className="mb-2 font-semibold">Run this inside the Git repository you want to control:</p><code className="block overflow-x-auto rounded bg-black/20 p-2 text-xs text-link">{pair}</code><button onClick={() => navigator.clipboard.writeText(pair)} className="mt-2 inline-flex items-center gap-1 text-xs text-link"><Copy className="h-3 w-3" />Copy command</button></div>}</section>
    <section className="grid gap-3 md:grid-cols-4">{[['Watcher', machine?.status || (connected ? 'connected' : 'waiting')], ['Branch', machine?.branch || '—'], ['Repository', machine?.repoName || machine?.repoPath || '—']].map(([name, value]) => <div key={name} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{name}</p><p className="mt-1 truncate font-bold">{value}</p></div>)}<div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">GitHub</p>{github.connected ? <p className="mt-1 font-bold text-emerald-400">Connected as {github.login}</p> : sessionCode ? <a href={`/api/github/login?code=${encodeURIComponent(sessionCode)}`} className="mt-1 inline-block font-bold text-link">Connect GitHub</a> : <p className="mt-1 font-bold">—</p>}</div></section>
    <section className="grid gap-5 lg:grid-cols-2"><div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center gap-2 border-b border-border p-4 font-bold"><Terminal className="h-4 w-4 text-link" />Remote terminal</div><div className="h-72 overflow-y-auto bg-[#060a12] p-4 font-mono text-xs">{lines.map(item => <p key={item.id} className={`mb-2 whitespace-pre-wrap ${item.kind === 'error' ? 'text-red-400' : item.kind === 'success' ? 'text-emerald-400' : item.kind === 'command' ? 'text-link' : 'text-slate-300'}`}>{item.text}</p>)}</div><div className="flex border-t border-border"><input value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => e.key === 'Enter' && void run()} disabled={!sessionCode} placeholder="autopilot status" className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm outline-none" /><button onClick={() => void run()} className="px-4 text-link"><Play className="h-4 w-4" /></button></div></div><div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 font-bold"><Activity className="h-4 w-4 text-link" />Live watcher activity</div>{countdown !== null && <p className="mt-4 rounded bg-blue-500/10 p-3 text-sm text-blue-400">Commit debounce: {countdown}s remaining</p>}{changes.length ? <ul className="mt-4 space-y-2 text-sm">{changes.map(file => <li key={file} className="rounded bg-muted p-2">Modified: <code>{file}</code></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No file changes reported by the paired watcher.</p>}<div className="mt-6 grid grid-cols-3 text-center"><div><b>{metric.commitsCount ?? commits.length}</b><p className="text-xs text-muted-foreground">Commits</p></div><div><b>{metric.focusMinutes ?? 0}m</b><p className="text-xs text-muted-foreground">Focus</p></div><div><b>{metric.streak ?? 0}</b><p className="text-xs text-muted-foreground">Streak</p></div></div></div></section>
    <section className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 font-bold"><GitCommit className="h-4 w-4 text-link" />Real Git commits</div>{commits.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Pair a CLI to load its actual Git history.</p> : <div className="mt-4 space-y-2">{commits.map(commit => <div key={commit.hash} className="rounded-xl border border-border p-3 text-sm"><code className="mr-3 font-bold text-link">{commit.hash}</code>{commit.message}<p className="mt-1 text-xs text-muted-foreground">{commit.branch} · {commit.author} · {commit.timestamp}</p>{commit.diff && <pre className="mt-2 text-xs text-muted-foreground">{commit.diff}</pre>}</div>)}</div>}</section>
    <section className="flex justify-between rounded-2xl border border-border bg-card p-4 text-sm"><span>Leaderboard entries come from real CLI metrics via <code>autopilot leaderboard --sync</code>.</span><Link href="/leaderboard" className="inline-flex items-center gap-1 font-bold text-link"><Trophy className="h-4 w-4" />Leaderboard</Link></section>
  </div></main>;
}

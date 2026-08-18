import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  Terminal, Play, Square, Pause, RotateCcw, Shield, ShieldAlert, Sparkles,
  GitCommit, GitBranch, FileCode, CheckCircle2, AlertTriangle, Info,
  Trophy, Flame, Activity, Zap, Copy, Check, Sliders, RefreshCw, Key,
  ExternalLink, Eye, ChevronRight, CornerDownLeft, Lock, Laptop
} from 'lucide-react';
import clsx from 'clsx';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'success' | 'error' | 'warning' | 'info' | 'header' | 'ascii';
  text: string;
  timestamp?: string;
}

interface SimulatedCommit {
  hash: string;
  message: string;
  branch: string;
  timestamp: string;
  author: string;
  tag: 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'security';
  diff: string;
}

const INITIAL_FILES: Record<string, string> = {
  'src/App.tsx': `import { useState } from 'react';
import { Navbar } from './components/Navbar';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <Navbar title="My SaaS Platform" />
      <main className="max-w-4xl mx-auto mt-8">
        <h1 className="text-3xl font-bold">Welcome to Dashboard</h1>
        <p className="text-slate-400 mt-2">Active users: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="mt-4 px-4 py-2 bg-lime-400 text-black font-bold rounded-lg"
        >
          Increment User
        </button>
      </main>
    </div>
  );
}`,
  'src/services/api.ts': `// API client service
export async function fetchUserData(userId: string) {
  const res = await fetch(\`/api/users/\${userId}\`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function submitTelemetry(event: string, payload: any) {
  console.log('[Telemetry]', event, payload);
  return { status: 'recorded' };
}`,
  'README.md': `# My SaaS Project

Automated development with Autopilot CLI.

## Quick Start
- \`npm install\`
- \`autopilot start\`
- Code and ship automatically!
`,
  '.autopilotrc.json': `{
  "minInterval": 20,
  "autoPush": true,
  "blockedBranches": ["main", "master"],
  "requireChecks": true,
  "ai": {
    "enabled": true,
    "provider": "openrouter",
    "model": "default"
  },
  "team": {
    "pullBeforePush": true,
    "preventSecrets": true,
    "preventLargeFiles": true
  }
}`
};

export default function PlaygroundPage() {
  // Watcher Engine State
  const [watcherStatus, setWatcherStatus] = useState<'stopped' | 'running' | 'paused' | 'debouncing'>('stopped');
  const [activeBranch, setActiveBranch] = useState('develop');
  const [activePreset, setActivePreset] = useState<'safe-team' | 'solo-speed' | 'strict-ci'>('safe-team');
  const [debounceProgress, setDebounceProgress] = useState(0);
  const [debounceSecondsLeft, setDebounceSecondsLeft] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);
  const [secretAlert, setSecretAlert] = useState<string | null>(null);

  // File Editor State
  const [files, setFiles] = useState<Record<string, string>>(INITIAL_FILES);
  const [activeFileName, setActiveFileName] = useState('src/App.tsx');
  const [activeTab, setActiveTab] = useState<'editor' | 'git' | 'ai' | 'doctor' | 'insights'>('editor');

  // Commits History
  const [commits, setCommits] = useState<SimulatedCommit[]>([
    {
      hash: '7a19c2e',
      message: 'chore: initial project configuration and autopilot setup',
      branch: 'develop',
      timestamp: '10m ago',
      author: 'Praise Masunga',
      tag: 'chore',
      diff: '+ created .autopilotrc.json\n+ configured git automation',
    },
    {
      hash: '3f8b01d',
      message: 'feat: add initial application skeleton and navbar',
      branch: 'develop',
      timestamp: '6m ago',
      author: 'Praise Masunga',
      tag: 'feat',
      diff: '+ src/App.tsx\n+ src/services/api.ts',
    },
  ]);
  const [selectedCommit, setSelectedCommit] = useState<SimulatedCommit | null>(null);

  // Productivity Metrics
  const [focusMinutes, setFocusMinutes] = useState(42);
  const [qualityScore, setQualityScore] = useState(94);
  const [streakDays, setStreakDays] = useState(5);
  const [syncedLeaderboard, setSyncedLeaderboard] = useState(false);

  // Custom API key configuration
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('default (Auto-Rotated Free Models)');
  const [showSettings, setShowSettings] = useState(false);

  // Terminal State
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: '1', type: 'header', text: '🚀 Autopilot CLI Interactive Web Tool & Watcher Simulator v4.0.2' },
    { id: '2', type: 'info', text: 'Type commands below or click the quick action chips. Workspace: /projects/my-app' },
    { id: '3', type: 'success', text: 'Type "help" for a list of available commands or "autopilot start" to begin.' },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Focus input on click anywhere in terminal
  const focusTerminal = () => {
    inputRef.current?.focus();
  };

  // Timer for active focus time
  useEffect(() => {
    if (watcherStatus === 'running' || watcherStatus === 'debouncing') {
      const interval = setInterval(() => {
        setFocusMinutes(prev => prev + 1);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [watcherStatus]);

  // Debounce Countdown Timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (watcherStatus === 'debouncing') {
      const totalSeconds = 5;
      setDebounceSecondsLeft(totalSeconds);
      setDebounceProgress(100);

      const stepMs = 100;
      let elapsed = 0;
      const totalMs = totalSeconds * 1000;

      timer = setInterval(() => {
        elapsed += stepMs;
        const remainingMs = Math.max(0, totalMs - elapsed);
        setDebounceSecondsLeft(Math.ceil(remainingMs / 1000));
        setDebounceProgress(Math.round((remainingMs / totalMs) * 100));

        if (elapsed >= totalMs) {
          clearInterval(timer);
          executeAutomatedCommit();
        }
      }, stepMs);
    }
    return () => clearInterval(timer);
  }, [watcherStatus, pendingChanges]);

  // Secret scanner check
  const checkSecrets = (code: string): string | null => {
    if (/sk[-_]live[-_][0-9a-zA-Z]{20,}/.test(code) || /sk[-_]or[-_]v1[-_][0-9a-zA-Z]{20,}/.test(code)) {
      return 'Secret Key detected (API Key Pattern)! Autopilot Secret Scanner has blocked the commit.';
    }
    if (/ghp_[0-9a-zA-Z]{36}/.test(code) || /github_pat_[0-9a-zA-Z_]{50,}/.test(code)) {
      return 'GitHub Personal Access Token detected! Staged commit aborted.';
    }
    if (/AKIA[0-9A-Z]{16}/.test(code)) {
      return 'AWS Access Key ID detected! Staged commit aborted.';
    }
    return null;
  };

  // Automated commit creator when debounce completes
  const executeAutomatedCommit = () => {
    const currentCode = files[activeFileName] || '';
    const secretFound = checkSecrets(currentCode);

    if (secretFound) {
      setSecretAlert(secretFound);
      setWatcherStatus('running');
      appendTerminalLines([
        { id: Math.random().toString(), type: 'error', text: `🛡️ [SECURITY GUARD] ${secretFound}` },
        { id: Math.random().toString(), type: 'warning', text: 'Commit cancelled to protect credentials. Remove secret to resume auto-commit.' },
      ]);
      return;
    }

    setSecretAlert(null);

    // Generate AI commit message based on active file and changes
    let tag: 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' = 'feat';
    let message = '';

    if (activeFileName === 'src/App.tsx') {
      if (currentCode.includes('useAuth') || currentCode.includes('Authentication')) {
        tag = 'feat';
        message = 'feat(auth): implement user authentication and session management';
      } else if (currentCode.includes('Theme') || currentCode.includes('dark')) {
        tag = 'feat';
        message = 'feat(ui): add theme switcher and dark mode tokens';
      } else {
        tag = 'feat';
        message = 'feat(app): update dashboard components and user counter';
      }
    } else if (activeFileName === 'src/services/api.ts') {
      tag = 'fix';
      message = 'fix(api): optimize telemetry endpoint and error handling';
    } else if (activeFileName === 'README.md') {
      tag = 'docs';
      message = 'docs: update setup instructions and quick start guide';
    } else {
      tag = 'refactor';
      message = `refactor: update ${activeFileName} configuration`;
    }

    const newHash = Math.random().toString(36).substring(2, 9);
    const newCommit: SimulatedCommit = {
      hash: newHash,
      message,
      branch: activeBranch,
      timestamp: 'just now',
      author: 'Praise Masunga',
      tag,
      diff: `--- a/${activeFileName}\n+++ b/${activeFileName}\n@@ -1,5 +1,8 @@\n+ [Autopilot AI commit generated]`,
    };

    setCommits(prev => [newCommit, ...prev]);
    setPendingChanges([]);
    setWatcherStatus('running');
    setQualityScore(prev => Math.min(100, prev + 1));

    appendTerminalLines([
      { id: Math.random().toString(), type: 'info', text: `[WATCHER] Debounce window elapsed. Processing batch for ${activeFileName}...` },
      { id: Math.random().toString(), type: 'success', text: `✔ AI Diff Engine generated: "${message}"` },
      { id: Math.random().toString(), type: 'success', text: `✔ [autopilot ${newHash}] ${message}` },
      { id: Math.random().toString(), type: 'info', text: `✔ Pushed changes to remote origin/${activeBranch}` },
    ]);
  };

  // Helper to append terminal lines
  const appendTerminalLines = (newLines: TerminalLine[]) => {
    setTerminalLines(prev => [...prev, ...newLines]);
  };

  // Trigger file modification
  const handleFileChange = (newContent: string) => {
    setFiles(prev => ({ ...prev, [activeFileName]: newContent }));
    if (!pendingChanges.includes(activeFileName)) {
      setPendingChanges(prev => [...prev, activeFileName]);
    }

    if (watcherStatus === 'running') {
      setWatcherStatus('debouncing');
      appendTerminalLines([
        { id: Math.random().toString(), type: 'info', text: `[WATCHER] Detected file modification in ${activeFileName}` },
        { id: Math.random().toString(), type: 'warning', text: '⏳ Debounce timer started (5s)... Batching further keystrokes.' },
      ]);
    }
  };

  // Quick Preset Modifications
  const applyQuickCodeChange = (presetType: 'auth' | 'fix' | 'leakSecret' | 'docs' | 'reset') => {
    if (presetType === 'auth') {
      setActiveFileName('src/App.tsx');
      const authCode = `import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, login, logout } = useAuth();
  const [count, setCount] = useState(1);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <Navbar title="Secure Cloud App" user={user} onLogout={logout} />
      <main className="max-w-4xl mx-auto mt-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h1 className="text-3xl font-bold">Authentication Hub</h1>
          {user ? (
            <p className="text-emerald-400 mt-2">Logged in as {user.email}</p>
          ) : (
            <button onClick={() => login()} className="mt-4 px-5 py-2.5 bg-lime-400 text-black font-bold rounded-xl">
              Sign In with SSO
            </button>
          )}
        </div>
      </main>
    </div>
  );
}`;
      handleFileChange(authCode);
    } else if (presetType === 'fix') {
      setActiveFileName('src/services/api.ts');
      const fixCode = `// Enhanced API Client with Retry & Circuit Breaker
export async function fetchUserData(userId: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function submitTelemetry(event: string, payload: any) {
  return fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, payload, timestamp: Date.now() }),
  });
}`;
      handleFileChange(fixCode);
    } else if (presetType === 'leakSecret') {
      setActiveFileName('src/services/api.ts');
      const leakedCode = `// INSECURE CODE WITH ACCIDENTAL API KEY:
const STRIPE_SECRET = "sk_live_51MabcXYZ1234567890ABCDEF123456";
const OPENROUTER_KEY = "sk-or-v1-99887766554433221100aabbccddeeff";

export function getPaymentClient() {
  return { apiKey: STRIPE_SECRET };
}`;
      handleFileChange(leakedCode);
    } else if (presetType === 'docs') {
      setActiveFileName('README.md');
      const docsCode = `# My SaaS Project

Intelligent Git automation powered by Autopilot CLI.

## Workflow
1. \`autopilot start\`
2. Work freely in your IDE.
3. Conventional commit messages are generated automatically.
4. Clean history with zero cognitive load.
`;
      handleFileChange(docsCode);
    } else if (presetType === 'reset') {
      setFiles(INITIAL_FILES);
      setPendingChanges([]);
      setSecretAlert(null);
      appendTerminalLines([
        { id: Math.random().toString(), type: 'info', text: 'Workspace files reset to clean baseline.' },
      ]);
    }
  };

  // Run Command in Terminal
  const executeCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const linesToAdd: TerminalLine[] = [
      { id: Math.random().toString(), type: 'command', text: trimmed, timestamp: new Date().toLocaleTimeString() }
    ];

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const subCmd = parts[1]?.toLowerCase();
    const arg = parts[2]?.toLowerCase();

    if (mainCmd === 'clear' || mainCmd === 'cls') {
      setTerminalLines([]);
      setCommandInput('');
      return;
    }

    if (mainCmd === 'help') {
      linesToAdd.push(
        { id: Math.random().toString(), type: 'header', text: 'Available Autopilot CLI Commands:' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot start [--background]  Start the background watcher daemon' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot stop                  Gracefully stop watcher and flush commits' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot status [--json]       Check daemon health and current state' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot pause [reason]        Pause watcher temporarily' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot resume                Resume paused watcher' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot undo                  Undo last commit and restore working tree' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot doctor [--json]       Run full environment diagnostic check' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot insights              Display productivity metrics and streaks' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot dashboard             Open live terminal activity monitor' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot preset [name]         Switch preset: safe-team, solo-speed, strict-ci' },
        { id: Math.random().toString(), type: 'info', text: '  autopilot leaderboard [--sync]  Sync stats to global leaderboard' },
        { id: Math.random().toString(), type: 'info', text: '  git status | git log | git diff Standard Git commands' },
        { id: Math.random().toString(), type: 'info', text: '  clear                           Clear terminal screen' }
      );
    } else if (mainCmd === 'autopilot' || mainCmd === 'agy' || mainCmd === 'auto') {
      if (!subCmd || subCmd === 'help' || subCmd === '--help') {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'info', text: 'Autopilot CLI v4.0.2 - Intelligent Git Automation' },
          { id: Math.random().toString(), type: 'info', text: 'Usage: autopilot <command> [options]' },
          { id: Math.random().toString(), type: 'info', text: 'Run "help" or "autopilot --help" for all commands.' }
        );
      } else if (subCmd === 'start') {
        if (activeBranch === 'main' || activeBranch === 'master') {
          linesToAdd.push(
            { id: Math.random().toString(), type: 'error', text: `✖ Protected branch detected: "${activeBranch}"` },
            { id: Math.random().toString(), type: 'warning', text: 'By default, Autopilot will not push directly to main/master. Switch to a feature branch with "git checkout -b develop" or change configuration.' }
          );
        } else {
          setWatcherStatus('running');
          linesToAdd.push(
            { id: Math.random().toString(), type: 'success', text: '🚀 Starting Autopilot watcher daemon...' },
            { id: Math.random().toString(), type: 'info', text: `Watching directory: /projects/my-app (branch: ${activeBranch})` },
            { id: Math.random().toString(), type: 'info', text: `Debounce window: 20s (minInterval). Background PID: 49102` },
            { id: Math.random().toString(), type: 'success', text: '✔ Daemon is ACTIVE. Edit files in the editor on the right to see live auto-commits!' }
          );
        }
      } else if (subCmd === 'stop') {
        setWatcherStatus('stopped');
        setPendingChanges([]);
        linesToAdd.push(
          { id: Math.random().toString(), type: 'info', text: 'Stopping Autopilot watcher daemon (PID 49102)...' },
          { id: Math.random().toString(), type: 'success', text: '✔ Watcher stopped gracefully. PID file cleared.' }
        );
      } else if (subCmd === 'pause') {
        setWatcherStatus('paused');
        const reason = parts.slice(2).join(' ') || 'Manual pause';
        linesToAdd.push(
          { id: Math.random().toString(), type: 'warning', text: `⏸ Watcher PAUSED: "${reason}"` },
          { id: Math.random().toString(), type: 'info', text: 'File changes will be ignored until you run "autopilot resume".' }
        );
      } else if (subCmd === 'resume') {
        setWatcherStatus('running');
        linesToAdd.push(
          { id: Math.random().toString(), type: 'success', text: '▶ Watcher RESUMED. Monitoring active.' }
        );
      } else if (subCmd === 'status') {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'header', text: '📊 Autopilot Status Report:' },
          { id: Math.random().toString(), type: 'info', text: `  Daemon State:      ${watcherStatus.toUpperCase()}` },
          { id: Math.random().toString(), type: 'info', text: `  Active Branch:     ${activeBranch}` },
          { id: Math.random().toString(), type: 'info', text: `  Preset:            ${activePreset}` },
          { id: Math.random().toString(), type: 'info', text: `  Pending Files:     ${pendingChanges.length > 0 ? pendingChanges.join(', ') : 'None (clean working tree)'}` },
          { id: Math.random().toString(), type: 'info', text: `  Total Commits:     ${commits.length}` },
          { id: Math.random().toString(), type: 'info', text: `  Focus Time:        ${focusMinutes} minutes` }
        );
      } else if (subCmd === 'doctor') {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'header', text: '🩺 Autopilot Doctor Diagnostics:' },
          { id: Math.random().toString(), type: 'success', text: '✔ Node.js runtime: v20.11.0 (compatible, requirement >= 18.0.0)' },
          { id: Math.random().toString(), type: 'success', text: '✔ Git binary detected in PATH: /usr/bin/git' },
          { id: Math.random().toString(), type: 'success', text: '✔ Remote repository: origin (https://github.com/PraiseTechzw/my-app.git)' },
          { id: Math.random().toString(), type: 'success', text: '✔ Config file valid: .autopilotrc.json (schema v4)' },
          { id: Math.random().toString(), type: 'success', text: '✔ Secret Scanner: ACTIVE (AWS, GitHub, Stripe, OpenAI patterns)' },
          { id: Math.random().toString(), type: 'success', text: `✔ AI Model Provider: OpenRouter (${aiModel})` },
          { id: Math.random().toString(), type: 'success', text: '✨ All 6 diagnostic health checks passed! Autopilot is fully operational.' }
        );
      } else if (subCmd === 'undo') {
        if (commits.length > 0) {
          const undone = commits[0];
          setCommits(prev => prev.slice(1));
          linesToAdd.push(
            { id: Math.random().toString(), type: 'warning', text: `⚠️ Undoing last commit [${undone.hash}]: "${undone.message}"` },
            { id: Math.random().toString(), type: 'info', text: 'Running `git reset --soft HEAD~1`...' },
            { id: Math.random().toString(), type: 'success', text: '✔ Commit reverted safely! All modified file changes preserved in working directory.' }
          );
        } else {
          linesToAdd.push(
            { id: Math.random().toString(), type: 'error', text: 'No recent commits to undo.' }
          );
        }
      } else if (subCmd === 'insights') {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'header', text: '📈 Autopilot Productivity & Focus Insights:' },
          { id: Math.random().toString(), type: 'info', text: '---------------------------------------------------' },
          { id: Math.random().toString(), type: 'info', text: `  Active Focus Time:      ${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m (88% in-the-zone)` },
          { id: Math.random().toString(), type: 'success', text: `  Commit Quality Score:   ${qualityScore}/100 (Conventional Commits)` },
          { id: Math.random().toString(), type: 'warning', text: `  Active Streak:          ${streakDays} consecutive days 🔥` },
          { id: Math.random().toString(), type: 'info', text: `  Commits Today:          ${commits.length}` },
          { id: Math.random().toString(), type: 'info', text: '  Peak Productivity Hour: 14:00 - 16:00' },
          { id: Math.random().toString(), type: 'info', text: '---------------------------------------------------' },
          { id: Math.random().toString(), type: 'success', text: 'Tip: Run "autopilot leaderboard --sync" to share your score globally.' }
        );
      } else if (subCmd === 'preset') {
        if (arg === 'safe-team' || arg === 'solo-speed' || arg === 'strict-ci') {
          setActivePreset(arg as any);
          linesToAdd.push(
            { id: Math.random().toString(), type: 'success', text: `✔ Applied configuration preset: "${arg}"` },
            { id: Math.random().toString(), type: 'info', text: arg === 'safe-team' ? 'Enabled: Pull-before-push, secret scanning, large file guard' : arg === 'solo-speed' ? 'Enabled: Fast debounce, local-first commits' : 'Enabled: Strict lint checks and pre-commit test validation' }
          );
        } else {
          linesToAdd.push(
            { id: Math.random().toString(), type: 'info', text: `Current preset: ${activePreset}` },
            { id: Math.random().toString(), type: 'info', text: 'Available presets: safe-team, solo-speed, strict-ci' }
          );
        }
      } else if (subCmd === 'leaderboard') {
        if (arg === '--sync' || parts.includes('--sync')) {
          setSyncedLeaderboard(true);
          linesToAdd.push(
            { id: Math.random().toString(), type: 'info', text: 'Syncing productivity metrics with Autopilot Global Leaderboard...' },
            { id: Math.random().toString(), type: 'success', text: `✔ Telemetry synced! Focus: ${focusMinutes}m, Score: ${qualityScore * 100} pts, Streak: ${streakDays}d` },
            { id: Math.random().toString(), type: 'success', text: '✔ Your rank: #1 (Praise Masunga). View on /leaderboard.' }
          );
        } else {
          linesToAdd.push(
            { id: Math.random().toString(), type: 'header', text: '🏆 Autopilot Global Leaderboard Rank:' },
            { id: Math.random().toString(), type: 'info', text: `  Developer:  Praise Masunga (You)` },
            { id: Math.random().toString(), type: 'info', text: `  Score:      ${qualityScore * 100} pts (#1 Global Rank)` },
            { id: Math.random().toString(), type: 'info', text: `  Focus:      ${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m` },
            { id: Math.random().toString(), type: 'info', text: 'Open /leaderboard to view the complete rankings.' }
          );
        }
      } else if (subCmd === 'dashboard') {
        setActiveTab('insights');
        linesToAdd.push(
          { id: Math.random().toString(), type: 'info', text: 'Opening live interactive dashboard visualizer in right pane...' },
          { id: Math.random().toString(), type: 'success', text: '✔ Dashboard active.' }
        );
      } else {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'error', text: `Unknown autopilot command: "${subCmd}". Type "help" for valid commands.` }
        );
      }
    } else if (mainCmd === 'git') {
      if (subCmd === 'status') {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'info', text: `On branch ${activeBranch}` },
          { id: Math.random().toString(), type: 'info', text: 'Your branch is up to date with \'origin/' + activeBranch + '\'.' }
        );
        if (pendingChanges.length > 0) {
          linesToAdd.push(
            { id: Math.random().toString(), type: 'warning', text: 'Changes not staged for commit:' },
            ...pendingChanges.map(p => ({ id: Math.random().toString(), type: 'error' as const, text: `  modified:   ${p}` }))
          );
        } else {
          linesToAdd.push(
            { id: Math.random().toString(), type: 'success', text: 'nothing to commit, working tree clean' }
          );
        }
      } else if (subCmd === 'log') {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'header', text: `Recent Git Commits on ${activeBranch}:` },
          ...commits.slice(0, 5).map(c => ({
            id: Math.random().toString(),
            type: 'info' as const,
            text: `* ${c.hash} (${c.timestamp}) - ${c.message} <${c.author}>`
          }))
        );
      } else if (subCmd === 'checkout' || subCmd === 'switch') {
        const targetBranch = parts[2] === '-b' ? parts[3] : parts[2];
        if (targetBranch) {
          setActiveBranch(targetBranch);
          linesToAdd.push(
            { id: Math.random().toString(), type: 'success', text: `Switched to branch '${targetBranch}'` }
          );
        }
      } else {
        linesToAdd.push(
          { id: Math.random().toString(), type: 'info', text: `git ${subCmd || ''} completed.` }
        );
      }
    } else {
      linesToAdd.push(
        { id: Math.random().toString(), type: 'error', text: `command not found: ${mainCmd}. Type "help" for a list of commands.` }
      );
    }

    appendTerminalLines(linesToAdd);
    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setCommandInput(history[history.length - 1 - nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommandInput(history[history.length - 1 - nextIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = commandInput.trim();
      const suggestions = [
        'autopilot start', 'autopilot stop', 'autopilot status', 'autopilot doctor',
        'autopilot undo', 'autopilot insights', 'autopilot leaderboard --sync',
        'autopilot preset safe-team', 'autopilot pause', 'autopilot resume', 'git status', 'git log'
      ];
      const match = suggestions.find(s => s.startsWith(current));
      if (match) setCommandInput(match);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background text-foreground selection:bg-link/30">
      {/* Top Hero / Control Header */}
      <section className="border-b border-border bg-card/40 backdrop-blur-md px-4 py-4 sticky top-16 z-30">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-link/10 text-link border border-link/20 shadow-sm shadow-link/10">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-foreground">Interactive Web Tool & Simulator</h1>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-link/20 text-link border border-link/30">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulate Autopilot CLI watcher, test commands, edit code, and inspect AI commits in real-time.
              </p>
            </div>
          </div>

          {/* Watcher Status & Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pill */}
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all',
              watcherStatus === 'running' && 'bg-green-500/10 border-green-500/30 text-green-400',
              watcherStatus === 'debouncing' && 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse',
              watcherStatus === 'paused' && 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
              watcherStatus === 'stopped' && 'bg-muted border-border text-muted-foreground'
            )}>
              <span className={clsx(
                'h-2 w-2 rounded-full',
                watcherStatus === 'running' && 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse',
                watcherStatus === 'debouncing' && 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)] animate-ping',
                watcherStatus === 'paused' && 'bg-yellow-400',
                watcherStatus === 'stopped' && 'bg-slate-500'
              )} />
              <span>
                {watcherStatus === 'debouncing' ? `DEBOUNCING (${debounceSecondsLeft}s)` : watcherStatus.toUpperCase()}
              </span>
            </div>

            {/* Quick Play/Stop Toggle */}
            {watcherStatus === 'stopped' ? (
              <button
                onClick={() => executeCommand('autopilot start')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-link text-black font-bold text-xs hover:bg-link-hover transition-all shadow-md shadow-link/10 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                <span>Start Watcher</span>
              </button>
            ) : (
              <button
                onClick={() => executeCommand('autopilot stop')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-destructive/20 border border-destructive/40 text-red-400 font-bold text-xs hover:bg-destructive/30 transition-all cursor-pointer"
              >
                <Square className="h-3.5 w-3.5 fill-red-400" />
                <span>Stop Watcher</span>
              </button>
            )}

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium text-foreground">
              <GitBranch className="h-3.5 w-3.5 text-link" />
              <select
                value={activeBranch}
                onChange={e => {
                  setActiveBranch(e.target.value);
                  appendTerminalLines([{ id: Math.random().toString(), type: 'info', text: `Switched branch to: ${e.target.value}` }]);
                }}
                className="bg-transparent border-0 outline-none text-xs font-bold text-foreground cursor-pointer"
              >
                <option value="develop" className="bg-slate-900 text-white">develop (safe)</option>
                <option value="feature/auth" className="bg-slate-900 text-white">feature/auth</option>
                <option value="fix/navbar" className="bg-slate-900 text-white">fix/navbar</option>
                <option value="main" className="bg-slate-900 text-white">main (protected)</option>
              </select>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-card border border-border hover:border-link/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Configure AI & Preset"
            >
              <Sliders className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Debounce Progress Bar */}
        {watcherStatus === 'debouncing' && (
          <div className="container mx-auto max-w-7xl mt-3">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-link h-full transition-all duration-100 ease-linear"
                style={{ width: `${debounceProgress}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Secret Warning Banner if secret detected */}
      {secretAlert && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 text-red-400 text-xs font-medium flex items-center justify-between">
          <div className="container mx-auto max-w-7xl flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-red-400" />
            <span>{secretAlert}</span>
          </div>
          <button
            onClick={() => applyQuickCodeChange('reset')}
            className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Clear Secret
          </button>
        </div>
      )}

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="border-b border-border bg-muted/50 px-4 py-4 animate-fade-in">
          <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border">
              <label className="text-xs font-bold text-foreground block mb-1">Preset Mode</label>
              <div className="flex gap-2 mt-2">
                {(['safe-team', 'solo-speed', 'strict-ci'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => executeCommand(`autopilot preset ${p}`)}
                    className={clsx(
                      'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activePreset === p ? 'bg-link text-black' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <label className="text-xs font-bold text-foreground block mb-1">Custom OpenRouter API Key (Optional)</label>
              <p className="text-[11px] text-muted-foreground mb-2">Optional: Use your own key or use the built-in free AI rotator.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="flex-1 bg-background border border-border px-3 py-1.5 rounded-lg text-xs outline-none focus:border-link text-foreground"
                />
                <button
                  onClick={() => {
                    appendTerminalLines([{ id: Math.random().toString(), type: 'success', text: apiKey ? '✔ Custom OpenRouter API key configured.' : '✔ Using built-in free tier model engine.' }]);
                  }}
                  className="px-3 py-1.5 bg-link/10 border border-link/30 text-link font-bold rounded-lg text-xs hover:bg-link/20 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">AI Model Engine</label>
                <select
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value)}
                  className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs outline-none focus:border-link text-foreground cursor-pointer"
                >
                  <option value="default (Auto-Rotated Free Models)">default (Auto-Rotated Free Models)</option>
                  <option value="google/gemini-2.0-flash">google/gemini-2.0-flash</option>
                  <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
                  <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
                </select>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2">Zero lock-in. Full privacy guaranteed.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Dual Pane Studio */}
      <div className="flex-1 container mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Terminal (6 Cols on desktop) */}
        <div className="lg:col-span-6 flex flex-col h-[650px] bg-[#050816] rounded-2xl border border-[#263244] shadow-2xl overflow-hidden font-mono text-xs">
          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0d1527] border-b border-[#263244] select-none flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-1.5 ml-3 text-slate-400 text-xs font-semibold">
                <Terminal className="h-3.5 w-3.5 text-link" />
                <span>autopilot-cli — zsh (interactive)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTerminalLines([])}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800/60 transition-colors"
                title="Clear screen"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Output Area */}
          <div
            onClick={focusTerminal}
            className="flex-1 p-4 overflow-y-auto space-y-1.5 leading-relaxed custom-scrollbar cursor-text"
          >
            {terminalLines.map(line => (
              <div key={line.id} className="break-all font-mono">
                {line.type === 'command' && (
                  <div className="flex items-start gap-2 text-white font-bold">
                    <span className="text-link select-none">$</span>
                    <span className="text-white">{line.text}</span>
                  </div>
                )}
                {line.type === 'header' && (
                  <div className="text-link font-bold pt-1 pb-0.5">{line.text}</div>
                )}
                {line.type === 'success' && (
                  <div className="text-emerald-400 flex items-start gap-1.5">
                    <span>{line.text}</span>
                  </div>
                )}
                {line.type === 'error' && (
                  <div className="text-red-400 font-semibold">{line.text}</div>
                )}
                {line.type === 'warning' && (
                  <div className="text-yellow-400">{line.text}</div>
                )}
                {line.type === 'info' && (
                  <div className="text-slate-300">{line.text}</div>
                )}
                {line.type === 'output' && (
                  <div className="text-slate-200">{line.text}</div>
                )}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div className="px-3 py-2 bg-[#090f1d] border-t border-[#1a2538] flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none mr-1">Quick:</span>
            {[
              { label: 'start', cmd: 'autopilot start' },
              { label: 'status', cmd: 'autopilot status' },
              { label: 'doctor', cmd: 'autopilot doctor' },
              { label: 'insights', cmd: 'autopilot insights' },
              { label: 'undo', cmd: 'autopilot undo' },
              { label: 'sync', cmd: 'autopilot leaderboard --sync' },
              { label: 'stop', cmd: 'autopilot stop' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => executeCommand(item.cmd)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 text-[11px] font-medium transition-all whitespace-nowrap border border-slate-700/50 cursor-pointer active:scale-95"
              >
                ${item.label}
              </button>
            ))}
          </div>

          {/* Interactive Command Input Line */}
          <div className="px-4 py-3 bg-[#0d1527] border-t border-[#263244] flex items-center gap-2 flex-shrink-0">
            <span className="text-link font-bold select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={e => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type 'autopilot start' or 'help'..."
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-xs font-mono"
              autoFocus
            />
            <button
              onClick={() => executeCommand(commandInput)}
              className="p-1.5 rounded-lg bg-link/10 text-link hover:bg-link/20 transition-colors cursor-pointer"
              title="Execute command"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Workspace & Inspector (6 Cols on desktop) */}
        <div className="lg:col-span-6 flex flex-col h-[650px] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Top Tabs */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border select-none">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'editor', label: 'Code Editor', icon: FileCode },
                { id: 'git', label: 'Commit Graph', icon: GitCommit, badge: commits.length },
                { id: 'ai', label: 'AI Inspector', icon: Sparkles },
                { id: 'doctor', label: 'Doctor', icon: Shield },
                { id: 'insights', label: 'Insights', icon: Activity },
              ].map(t => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                      active
                        ? 'bg-card text-foreground shadow-sm border border-border text-link'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className={clsx('h-3.5 w-3.5', active ? 'text-link' : 'text-muted-foreground')} />
                    <span>{t.label}</span>
                    {t.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full bg-link/10 text-link text-[10px]">{t.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Tab 1: Code Editor & Keystroke Simulator */}
            {activeTab === 'editor' && (
              <div className="flex flex-col h-full space-y-3">
                {/* File Sub-tabs */}
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    {Object.keys(files).map(fileName => (
                      <button
                        key={fileName}
                        onClick={() => setActiveFileName(fileName)}
                        className={clsx(
                          'px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer',
                          activeFileName === fileName
                            ? 'bg-link/10 text-link border border-link/30 font-bold'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {fileName}
                      </button>
                    ))}
                  </div>

                  {pendingChanges.includes(activeFileName) && (
                    <span className="text-[11px] text-yellow-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      Uncommitted changes
                    </span>
                  )}
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Simulate Edit:</span>
                  <button
                    onClick={() => applyQuickCodeChange('auth')}
                    className="px-2.5 py-1 rounded-lg bg-link/10 hover:bg-link/20 text-link text-xs font-semibold border border-link/20 transition-all cursor-pointer"
                  >
                    ⚡ Add Auth Hook
                  </button>
                  <button
                    onClick={() => applyQuickCodeChange('fix')}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/20 transition-all cursor-pointer"
                  >
                    🐛 Fix API Timeout
                  </button>
                  <button
                    onClick={() => applyQuickCodeChange('leakSecret')}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
                    title="Test Secret Scanner"
                  >
                    🚨 Leak API Key (Test Guard)
                  </button>
                  <button
                    onClick={() => applyQuickCodeChange('docs')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all cursor-pointer"
                  >
                    📝 Update Docs
                  </button>
                  <button
                    onClick={() => applyQuickCodeChange('reset')}
                    className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer ml-auto"
                  >
                    Reset
                  </button>
                </div>

                {/* Live Code Area */}
                <div className="flex-1 relative flex flex-col bg-[#050816] rounded-xl border border-[#263244] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1527] border-b border-[#263244] text-[11px] font-mono text-muted-foreground">
                    <span>{activeFileName}</span>
                    <span className="text-link">Live Editable</span>
                  </div>
                  <textarea
                    value={files[activeFileName] || ''}
                    onChange={e => handleFileChange(e.target.value)}
                    className="flex-1 w-full p-3 bg-transparent font-mono text-xs text-slate-100 outline-none resize-none leading-relaxed custom-scrollbar"
                    spellCheck={false}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-link" />
                    <span>Typing automatically alerts the Autopilot file watcher.</span>
                  </span>
                  {watcherStatus === 'stopped' && (
                    <button
                      onClick={() => executeCommand('autopilot start')}
                      className="text-link font-bold hover:underline cursor-pointer"
                    >
                      Start watcher to auto-commit
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Visual Git Commit Graph */}
            {activeTab === 'git' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Interactive Git Commit Tree</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => executeCommand('autopilot undo')}
                      className="px-3 py-1 bg-destructive/10 border border-destructive/30 text-red-400 font-bold text-xs rounded-lg hover:bg-destructive/20 transition-all cursor-pointer"
                    >
                      Undo Last Commit
                    </button>
                  </div>
                </div>

                {/* Commits Timeline */}
                <div className="space-y-3">
                  {commits.map((c) => (
                    <div
                      key={c.hash}
                      onClick={() => setSelectedCommit(c)}
                      className={clsx(
                        'p-3.5 rounded-xl border transition-all cursor-pointer group relative',
                        selectedCommit?.hash === c.hash
                          ? 'bg-card border-link/50 shadow-lg shadow-link/5'
                          : 'bg-card/50 border-border hover:border-border/80 hover:bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                            c.tag === 'feat' && 'bg-link/20 text-link border border-link/30',
                            c.tag === 'fix' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                            c.tag === 'docs' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                            c.tag === 'chore' && 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          )}>
                            {c.tag}
                          </span>
                          <span className="font-mono text-xs font-bold text-link">{c.hash}</span>
                          <span className="text-[11px] text-muted-foreground">• {c.branch}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{c.timestamp}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground leading-relaxed">{c.message}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                        <span>Author: {c.author}</span>
                        <span className="text-link group-hover:underline flex items-center gap-1">
                          View Diff <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCommit && (
                  <div className="p-4 bg-[#050816] rounded-xl border border-[#263244] font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#263244]">
                      <span className="text-link font-bold">Diff: {selectedCommit.hash}</span>
                      <button onClick={() => setSelectedCommit(null)} className="text-muted-foreground hover:text-white">Close</button>
                    </div>
                    <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">{selectedCommit.diff}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: AI Commit Inspector */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="p-4 bg-card rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-link" />
                    <h3 className="text-sm font-bold text-foreground">AI Commit Generation Reasoning Engine</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When Autopilot detects staged modifications, it extracts semantic AST and git diff chunks to synthesize Senior Developer-grade Conventional Commit messages.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Active AI Provider</span>
                    <p className="text-xs font-bold text-foreground">OpenRouter (Free Tier Rotation)</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Quality Standards</span>
                    <p className="text-xs font-bold text-link">Conventional Commits v1.0</p>
                  </div>
                </div>

                <div className="p-4 bg-[#050816] rounded-xl border border-[#263244] space-y-3 font-mono text-xs">
                  <span className="text-slate-400 block text-[11px] border-b border-[#263244] pb-1">AI Prompt & Parsing Pipeline:</span>
                  <div className="text-slate-300 space-y-2">
                    <p><span className="text-link">[DIFF_ANALYZER]</span> Staged file: {activeFileName}</p>
                    <p><span className="text-emerald-400">[SEMANTIC_SCOPE]</span> Detected module: {activeFileName.split('/')[1] || 'root'}</p>
                    <p><span className="text-blue-400">[SYNTHESIS]</span> Confidence: 98.4%</p>
                    <p className="p-2.5 rounded bg-black/50 border border-[#334155] text-white">
                      "feat(auth): implement user authentication and session management"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Doctor & Security Diagnostics */}
            {activeTab === 'doctor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">6-Point Health & Safety Diagnostics</h3>
                  <button
                    onClick={() => executeCommand('autopilot doctor')}
                    className="px-3 py-1 bg-link text-black font-bold text-xs rounded-lg hover:bg-link-hover transition-all cursor-pointer"
                  >
                    Run Diagnostics
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    { name: 'Node.js Runtime Environment', status: 'v20.11.0 (Compatible >= 18.0.0)', ok: true },
                    { name: 'Git Binary & PATH Configuration', status: 'Detected /usr/bin/git', ok: true },
                    { name: 'Branch Protection Policy', status: `Protected branches: main, master (Active: ${activeBranch})`, ok: activeBranch !== 'main' },
                    { name: 'Secret Scanning Guard', status: secretAlert ? 'ALERT: Key Detected' : 'Active (6 Pattern Filters)', ok: !secretAlert },
                    { name: 'Pre-Commit Checks & Linting', status: 'Active (Preset: ' + activePreset + ')', ok: true },
                    { name: 'AI Commit Provider Connectivity', status: `OpenRouter (${aiModel})`, ok: true },
                  ].map((chk, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        {chk.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">{chk.name}</p>
                          <p className="text-[11px] text-muted-foreground">{chk.status}</p>
                        </div>
                      </div>
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        chk.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}>
                        {chk.ok ? 'Healthy' : 'Attention'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Productivity & Leaderboard */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                    <Activity className="h-5 w-5 text-link mx-auto mb-1" />
                    <span className="text-xl font-black text-foreground">{Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m</span>
                    <span className="text-[11px] text-muted-foreground block">Active Focus</span>
                  </div>
                  <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                    <Zap className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-xl font-black text-foreground">{qualityScore}/100</span>
                    <span className="text-[11px] text-muted-foreground block">Quality Score</span>
                  </div>
                  <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                    <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                    <span className="text-xl font-black text-foreground">{streakDays} Days</span>
                    <span className="text-[11px] text-muted-foreground block">Active Streak</span>
                  </div>
                </div>

                <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Global Leaderboard Sync</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {syncedLeaderboard ? 'Your metrics are live on the Global Leaderboard!' : 'Sync your local session metrics to view your world ranking.'}
                    </p>
                  </div>
                  <button
                    onClick={() => executeCommand('autopilot leaderboard --sync')}
                    className="px-3.5 py-1.5 bg-link text-black font-bold text-xs rounded-xl hover:bg-link-hover transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>{syncedLeaderboard ? 'Sync Again' : 'Sync Now'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-center">
                  <Link href="/leaderboard" className="text-xs font-bold text-link hover:underline inline-flex items-center gap-1">
                    View Public Leaderboard <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

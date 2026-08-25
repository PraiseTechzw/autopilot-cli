import React, { useEffect, useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import StateManager from '../core/state.js';
import git from '../core/git.js';
import HistoryManager from '../core/history.js';
import processUtils from '../utils/process.js';

const { getRunningPid } = processUtils;
const e = React.createElement;
const LIME = '#b8ff1f';
const MUTED = '#7d8799';
const PANEL = '#202938';

function truncate(value, max = 62) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatTime(value) {
  if (!value) return 'No activity yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const meta = {
    running: { label: 'RUNNING', color: 'green', mark: '●' },
    paused: { label: 'PAUSED', color: 'yellow', mark: 'Ⅱ' },
    stopped: { label: 'STOPPED', color: 'red', mark: '○' },
    loading: { label: 'LOADING', color: 'cyan', mark: '◌' },
    error: { label: 'DEGRADED', color: 'red', mark: '!' },
  }[status] || { label: String(status).toUpperCase(), color: 'white', mark: '•' };

  return e(
    Text,
    { color: meta.color, bold: true },
    `${meta.mark} ${meta.label}`
  );
}

function StatCard({ label, value, detail, color = 'white' }) {
  return e(
    Box,
    { flexDirection: 'column', width: '25%', minWidth: 18, paddingX: 1, borderStyle: 'single', borderColor: PANEL },
    e(Text, { color: MUTED, dimColor: true }, label.toUpperCase()),
    e(Text, { color, bold: true }, value),
    e(Text, { color: MUTED, dimColor: true }, truncate(detail, 20))
  );
}

function SectionTitle({ children, right }) {
  return e(
    Box,
    { justifyContent: 'space-between', marginBottom: 1 },
    e(Text, { color: LIME, bold: true }, children),
    right ? e(Text, { color: MUTED, dimColor: true }, right) : null
  );
}

function DashboardHotkeys({ root, enabled, onError }) {
  useInput((input) => {
    try {
      if (input === 'q') process.exit(0);
      if (input === 'p') {
        const stateManager = new StateManager(root);
        if (stateManager.isPaused()) stateManager.resume();
        else stateManager.pause('Dashboard toggle');
      }
    } catch (error) {
      onError(error);
    }
  }, { isActive: enabled });

  return null;
}

function Dashboard() {
  const root = process.cwd();
  const isInteractive = process.stdin.isTTY;
  const [status, setStatus] = useState('loading');
  const [pid, setPid] = useState(null);
  const [branch, setBranch] = useState('unknown');
  const [lastCommit, setLastCommit] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [todayCommits, setTodayCommits] = useState(0);
  const [pausedState, setPausedState] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = async () => {
    const errors = [];
    const [pidResult, branchResult, statusResult] = await Promise.allSettled([
      getRunningPid(root),
      git.getBranch(root),
      git.getPorcelainStatus(root),
    ]);

    const currentPid = pidResult.status === 'fulfilled' ? pidResult.value : null;
    if (pidResult.status === 'rejected') errors.push(pidResult.reason);
    if (branchResult.status === 'fulfilled') setBranch(branchResult.value || 'unknown');
    else errors.push(branchResult.reason);

    const stateManager = new StateManager(root);
    try {
      if (stateManager.isPaused()) {
        setStatus('paused');
        setPausedState(stateManager.getState());
      } else if (currentPid) {
        setStatus('running');
        setPausedState(null);
      } else {
        setStatus('stopped');
        setPausedState(null);
      }
    } catch (error) {
      errors.push(error);
      setStatus('error');
    }

    if (statusResult.status === 'fulfilled' && statusResult.value?.ok) {
      setPendingFiles(statusResult.value.files || []);
    } else if (statusResult.status === 'rejected') {
      errors.push(statusResult.reason);
    }
    setPid(currentPid);

    try {
      const historyManager = new HistoryManager(root);
      const latest = historyManager.getLastCommit();
      setLastCommit(latest);
      const today = new Date().toDateString();
      setTodayCommits(historyManager.getHistory().filter((commit) => new Date(commit.timestamp).toDateString() === today).length);
    } catch (error) {
      errors.push(error);
    }

    setLastRefresh(new Date());
    setLastError(errors.length ? errors[0]?.message || 'Some dashboard data is unavailable' : null);
  };

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [root]);

  const effectiveStatus = lastError && status === 'loading' ? 'error' : status;
  const statusDetail = status === 'paused'
    ? `Reason: ${truncate(pausedState?.reason || 'manual pause', 34)}`
    : status === 'running'
      ? `PID ${pid || 'unknown'}`
      : status === 'stopped'
        ? 'Watcher is offline'
        : 'Refreshing repository state';

  return e(
    Box,
    { flexDirection: 'column', width: '100%', paddingX: 1, paddingY: 1 },
    e(
      Box,
      { flexDirection: 'column', borderStyle: 'round', borderColor: LIME, paddingX: 2, paddingY: 1, marginBottom: 1 },
      e(
        Box,
        { justifyContent: 'space-between' },
        e(Text, { color: LIME, bold: true }, 'AUTOPILOT'),
        e(Text, { color: MUTED, dimColor: true }, 'GIT AUTOMATION CONTROL CENTER')
      ),
      e(
        Box,
        { justifyContent: 'space-between', marginTop: 1 },
        e(Text, { bold: true }, 'Repository Dashboard'),
        e(StatusBadge, { status: effectiveStatus })
      ),
      e(Text, { color: MUTED, dimColor: true }, truncate(root, 76))
    ),
    e(
      Box,
      { marginBottom: 1 },
      e(StatCard, { label: 'Branch', value: `⎇ ${truncate(branch, 18)}`, detail: status === 'running' ? 'active branch' : 'repository branch', color: branch === 'main' || branch === 'master' ? 'yellow' : 'cyan' }),
      e(StatCard, { label: 'Watcher', value: status === 'running' ? 'Online' : status === 'paused' ? 'Paused' : 'Offline', detail: statusDetail, color: status === 'running' ? 'green' : status === 'paused' ? 'yellow' : 'red' }),
      e(StatCard, { label: 'Pending', value: String(pendingFiles.length), detail: pendingFiles.length ? 'files waiting' : 'working tree clean', color: pendingFiles.length ? 'yellow' : 'green' }),
      e(StatCard, { label: 'Today', value: String(todayCommits), detail: 'automated commits', color: LIME })
    ),
    e(
      Box,
      { flexDirection: 'column', borderStyle: 'round', borderColor: PANEL, paddingX: 2, paddingY: 1, marginBottom: 1 },
      e(SectionTitle, { right: lastRefresh ? `refreshed ${formatTime(lastRefresh)}` : 'initializing' }, 'ACTIVITY'),
      lastCommit
        ? e(
            Box,
            { flexDirection: 'column' },
            e(Text, { bold: true }, truncate(lastCommit.message || 'Automated commit', 76)),
            e(Text, { color: MUTED, dimColor: true }, `Last commit ${formatTime(lastCommit.timestamp)}  ·  ${lastCommit.hash ? lastCommit.hash.slice(0, 8) : 'local'}`)
          )
        : e(Text, { color: MUTED, dimColor: true }, 'No automated commits recorded yet.')
    ),
    e(
      Box,
      { flexDirection: 'column', borderStyle: 'round', borderColor: PANEL, paddingX: 2, paddingY: 1, marginBottom: 1 },
      e(SectionTitle, { right: `${pendingFiles.length} total` }, 'PENDING CHANGES'),
      pendingFiles.length === 0
        ? e(Text, { color: 'green' }, '✓  No pending changes — your working tree is clear.')
        : pendingFiles.slice(0, 8).map((file, index) => e(
            Box,
            { key: `${file.file}-${index}`, justifyContent: 'space-between' },
            e(Text, { color: file.status === 'D' ? 'red' : file.status === '?' ? 'yellow' : 'cyan' }, `${file.status || 'M'}  ${truncate(file.file, 70)}`),
            e(Text, { color: MUTED, dimColor: true }, file.status === '?' ? 'untracked' : 'tracked')
          )),
      pendingFiles.length > 8 ? e(Text, { color: MUTED, dimColor: true }, `… and ${pendingFiles.length - 8} more`) : null
    ),
    lastError ? e(Text, { color: 'yellow' }, `! ${truncate(lastError, 78)}`) : null,
    e(
      Box,
      { justifyContent: 'space-between', paddingX: 1 },
      e(Text, { color: MUTED, dimColor: true }, isInteractive ? "[p] pause/resume   [q] quit" : 'Non-interactive preview mode'),
      e(Text, { color: LIME, dimColor: true }, 'Autopilot v4')
    ),
    isInteractive ? e(DashboardHotkeys, { root, enabled: true, onError: (error) => setLastError(error.message) }) : null
  );
}

export default function runDashboard() {
  if (!process.stdin.isTTY && !process.env.AUTOPILOT_TEST_MODE) {
    console.error('Error: Dashboard requires an interactive terminal (TTY).');
    process.exit(1);
  }
  render(e(Dashboard));
}

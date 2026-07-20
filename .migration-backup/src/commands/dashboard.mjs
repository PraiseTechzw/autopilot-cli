import React, { useEffect, useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import fs from 'fs-extra';
import StateManager from '../core/state.js';
import git from '../core/git.js';
import HistoryManager from '../core/history.js';
import processUtils from '../utils/process.js';

const { getRunningPid } = processUtils;
const e = React.createElement;

const Badge = ({ label, color }) => e(Text, { color, bold: true }, label);

const DashboardHotkeys = ({ root, enabled }) => {
  useInput((input) => {
    if (input === 'q') {
      process.exit(0);
    }

    if (input === 'p') {
      const stateManager = new StateManager(root);
      if (stateManager.isPaused()) {
        stateManager.resume();
      } else {
        stateManager.pause('Dashboard toggle');
      }
    }
  }, { isActive: enabled });

  return null;
};

const Dashboard = () => {
  const root = process.cwd();
  const isInteractive = process.stdin.isTTY;

  const [status, setStatus] = useState('loading');
  const [pid, setPid] = useState(null);
  const [lastCommit, setLastCommit] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [todayStats, setTodayStats] = useState({ commits: 0 });
  const [pausedState, setPausedState] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentPid = await getRunningPid(root);
        setPid(currentPid);

        const stateManager = new StateManager(root);
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

        const historyManager = new HistoryManager(root);
        setLastCommit(historyManager.getLastCommit());

        const statusObj = await git.getPorcelainStatus(root);
        if (statusObj.ok) {
          setPendingFiles(statusObj.files);
        }

        const history = historyManager.getHistory();
        const today = new Date().toDateString();
        const count = history.filter((c) => new Date(c.timestamp).toDateString() === today).length;
        setTodayStats({ commits: count });
      } catch {
        // Keep the dashboard resilient in non-interactive or partially initialized repos.
      }
    };

    void fetchData();
    const timer = setInterval(() => {
      void fetchData();
    }, 5000);

    return () => clearInterval(timer);
  }, [root]);

  return e(
    Box,
    { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    e(
      Box,
      { marginBottom: 1, flexDirection: 'column' },
      e(Text, { bold: true }, 'Autopilot Dashboard'),
      e(Text, null, 'Real-time repo status and activity')
    ),
    e(
      Box,
      { marginBottom: 1 },
      e(Text, { bold: true }, 'Status: '),
      status === 'running' && e(Badge, { label: `Running (PID: ${pid ?? 'unknown'})`, color: 'green' }),
      status === 'paused' && e(Badge, { label: `Paused (${pausedState?.reason || 'no reason'})`, color: 'yellow' }),
      status === 'stopped' && e(Badge, { label: 'Stopped', color: 'red' }),
      status === 'loading' && e(Text, null, 'Loading...')
    ),
    e(
      Box,
      { flexDirection: 'column', marginBottom: 1 },
      e(Text, { bold: true }, 'Activity'),
      e(Text, null, `Last Commit: ${lastCommit ? lastCommit.message : 'None'}`),
      e(Text, null, `Today: ${todayStats.commits} commit(s)`)
    ),
    e(
      Box,
      { flexDirection: 'column', marginBottom: 1 },
      e(Text, { bold: true }, `Pending Changes (${pendingFiles.length})`),
      pendingFiles.length === 0
        ? e(Text, null, 'No pending changes')
        : pendingFiles.slice(0, 5).map((f, idx) => e(Text, { key: `${f.file}-${idx}` }, `- ${f.status} ${f.file}`)),
      pendingFiles.length > 5 && e(Text, null, `...and ${pendingFiles.length - 5} more`)
    ),
    e(Box, null, e(Text, null, "Press 'p' to toggle pause, 'q' to quit")),
    isInteractive && e(DashboardHotkeys, { root, enabled: true })
  );
};

export default function runDashboard() {
  if (!process.stdin.isTTY && !process.env.AUTOPILOT_TEST_MODE) {
    console.error('Error: Dashboard requires an interactive terminal (TTY).');
    process.exit(1);
  }

  render(e(Dashboard));
}

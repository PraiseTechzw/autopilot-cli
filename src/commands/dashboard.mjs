import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import fs from 'fs-extra';
import path from 'path';
import StateManager from '../core/state.js';
import git from '../core/git.js';
import HistoryManager from '../core/history.js';
import { getPid } from '../utils/process.js';

const e = React.createElement;

// Dashboard Component
const Dashboard = () => {
  const { exit } = useApp();
  const root = process.cwd();
  
  const [status, setStatus] = useState('loading');
  const [pid, setPid] = useState(null);
  const [lastCommit, setLastCommit] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [todayStats, setTodayStats] = useState({ commits: 0 });
  const [pausedState, setPausedState] = useState(null);

  // Poll for updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Check process status
        const currentPid = await getPid(root);
        setPid(currentPid);
        
        // 2. Check Paused State
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

        // 3. Last Commit
        const historyManager = new HistoryManager(root);
        const last = historyManager.getLastCommit();
        setLastCommit(last);

        // 4. Pending Files
        const statusObj = await git.getPorcelainStatus(root);
        if (statusObj.ok) {
           setPendingFiles(statusObj.files);
        }

        // 5. Today Stats (Simple count from history)
        const history = historyManager.getHistory();
        const today = new Date().toDateString();
        const count = history.filter(c => new Date(c.timestamp).toDateString() === today).length;
        setTodayStats({ commits: count });

      } catch (err) {
        // ignore errors
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard controls
  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }
    if (input === 'p') {
      // Toggle pause
      const stateManager = new StateManager(root);
      if (stateManager.isPaused()) {
        stateManager.resume();
      } else {
        stateManager.pause('Dashboard toggle');
      }
      // Immediate refresh
    }
  });

  return e(Box, { flexDirection: "column", padding: 1, borderStyle: "round", borderColor: "cyan" },
    // Header
    e(Box, { marginBottom: 1 },
      e(Gradient, { name: "morning" },
        e(BigText, { text: "Autopilot", font: "simple" })
      )
    ),

    // Status
    e(Box, { marginBottom: 1 },
      e(Text, { bold: true }, "Status: "),
      status === 'running' && e(Text, { color: "green" }, `🟢 Running (PID: ${pid})`),
      status === 'paused' && e(Text, { color: "yellow" }, `⏸️  Paused (${pausedState?.reason})`),
      status === 'stopped' && e(Text, { color: "red" }, "🔴 Stopped"),
      status === 'loading' && e(Text, {}, e(Spinner, { type: "dots" }), " Loading...")
    ),

    // Activity
    e(Box, { flexDirection: "column", marginBottom: 1 },
      e(Text, { underline: true }, "Activity"),
      e(Box, {},
        e(Text, {}, "Last Commit: "),
        e(Text, { color: "cyan" }, lastCommit ? `${lastCommit.message} (${new Date(lastCommit.timestamp).toLocaleTimeString()})` : 'None')
      ),
      e(Box, {},
        e(Text, {}, "Today's Commits: "),
        e(Text, { color: "green" }, todayStats.commits)
      )
    ),

    // Pending Changes
    e(Box, { flexDirection: "column", marginBottom: 1 },
      e(Text, { underline: true }, `Pending Changes (${pendingFiles.length})`),
      pendingFiles.length === 0 ? 
        e(Text, { color: "gray" }, "No pending changes") :
        pendingFiles.slice(0, 5).map((f, i) => 
          e(Text, { key: i, color: "yellow" }, ` ${f.status} ${f.file}`)
        ),
      pendingFiles.length > 5 && e(Text, { color: "gray" }, ` ...and ${pendingFiles.length - 5} more`)
    ),

    // Footer
    e(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray" },
      e(Text, {}, "Press 'p' to toggle pause, 'q' to quit dashboard")
    )
  );
};

export default function runDashboard() {
  render(e(Dashboard));
}

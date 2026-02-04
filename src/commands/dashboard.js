const React = require('react');
const { render, Box, Text, useInput, useApp } = require('ink');
const Gradient = require('ink-gradient');
const BigText = require('ink-big-text');
const Spinner = require('ink-spinner').default;
const { useState, useEffect } = React;
const fs = require('fs-extra');
const path = require('path');
const StateManager = require('../core/state');
const git = require('../core/git');
const HistoryManager = require('../core/history');
const { getPid } = require('../utils/process');

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

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Box marginBottom={1}>
        <Gradient name="morning">
          <BigText text="Autopilot" font="simple" />
        </Gradient>
      </Box>

      <Box marginBottom={1}>
        <Text bold>Status: </Text>
        {status === 'running' && <Text color="green">🟢 Running (PID: {pid})</Text>}
        {status === 'paused' && <Text color="yellow">⏸️  Paused ({pausedState?.reason})</Text>}
        {status === 'stopped' && <Text color="red">🔴 Stopped</Text>}
        {status === 'loading' && <Text><Spinner type="dots" /> Loading...</Text>}
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text underline>Activity</Text>
        <Box>
          <Text>Last Commit: </Text>
          <Text color="cyan">{lastCommit ? `${lastCommit.message} (${new Date(lastCommit.timestamp).toLocaleTimeString()})` : 'None'}</Text>
        </Box>
        <Box>
          <Text>Today's Commits: </Text>
          <Text color="green">{todayStats.commits}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text underline>Pending Changes ({pendingFiles.length})</Text>
        {pendingFiles.length === 0 ? (
          <Text color="gray">No pending changes</Text>
        ) : (
          pendingFiles.slice(0, 5).map((f, i) => (
            <Text key={i} color="yellow"> {f.status} {f.file}</Text>
          ))
        )}
        {pendingFiles.length > 5 && <Text color="gray"> ...and {pendingFiles.length - 5} more</Text>}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray">
        <Text>Press 'p' to toggle pause, 'q' to quit dashboard</Text>
      </Box>
    </Box>
  );
};

function runDashboard() {
  render(React.createElement(Dashboard));
}

module.exports = runDashboard;

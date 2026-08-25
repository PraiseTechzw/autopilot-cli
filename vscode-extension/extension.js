const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ACTIONS = new Set(['start', 'stop', 'pause', 'resume', 'undo']);
const SETTINGS = [
  ['debounceMs', 'Debounce delay', 'number'],
  ['autoPush', 'Auto push', 'boolean'],
  ['teamMode', 'Team mode', 'boolean'],
  ['notificationsEnabled', 'Notifications', 'boolean'],
  ['minSecondsBetweenCommits', 'Commit cooldown', 'number'],
];

function workspaceRoot() {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function parseJsonOutput(output) {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try { return JSON.parse(lines[index]); } catch (_) { /* find the JSON line */ }
  }
  return null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

class AutopilotController {
  constructor(context) {
    this.context = context;
    this.output = vscode.window.createOutputChannel('Autopilot');
    this.view = null;
    this.status = { state: 'loading', branch: '—', pending: 0, message: 'Connecting to Autopilot…' };
    this.timer = null;
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBar.command = 'autopilot.refresh';
    this.statusBar.tooltip = 'Open Autopilot dashboard';
    context.subscriptions.push(this.output, this.statusBar);
  }

  activate() {
    this.registerCommands();
    this.context.subscriptions.push(vscode.window.registerWebviewViewProvider('autopilot.dashboard', this));
    this.updateStatusBar();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), this.refreshInterval());
    this.context.subscriptions.push({ dispose: () => clearInterval(this.timer) });
  }

  refreshInterval() {
    return Math.max(1000, vscode.workspace.getConfiguration('autopilot').get('refreshIntervalMs', 5000));
  }

  registerCommands() {
    for (const action of ['refresh', ...ACTIONS, 'settings', 'logs']) {
      this.context.subscriptions.push(vscode.commands.registerCommand(`autopilot.${action}`, () => {
        if (action === 'refresh') return this.refresh();
        if (action === 'settings') return this.openSettings();
        if (action === 'logs') return this.output.show(true);
        return this.runAction(action);
      }));
    }
  }

  cliInvocation(args) {
    const root = workspaceRoot();
    const config = vscode.workspace.getConfiguration('autopilot');
    const configuredPath = config.get('cliPath', 'autopilot');
    if (config.get('useWorkspaceCli', true) && root) {
      const localBin = path.join(root, 'bin', 'autopilot.js');
      try { require('node:fs').accessSync(localBin); return { command: process.execPath, args: [localBin, ...args] }; } catch (_) { /* use configured CLI */ }
    }
    return { command: configuredPath, args };
  }

  runCli(args) {
    return new Promise((resolve, reject) => {
      const root = workspaceRoot();
      if (!root) return reject(new Error('Open an Autopilot repository first.'));
      const invocation = this.cliInvocation(args);
      const child = spawn(invocation.command, invocation.args, { cwd: root, env: process.env });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; this.output.append(chunk.toString()); });
      child.stderr.on('data', (chunk) => { stderr += chunk; this.output.append(chunk.toString()); });
      child.on('error', reject);
      child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr.trim() || `Autopilot exited with code ${code}`)));
    });
  }

  async refresh() {
    try {
      const result = await this.runCli(['status', '--json']);
      const data = parseJsonOutput(result.stdout);
      this.status = {
        state: data?.paused ? 'paused' : data?.running ? 'running' : 'stopped',
        branch: data?.branch || data?.currentBranch || '—',
        pending: data?.pendingFiles?.length ?? data?.pending ?? 0,
        message: data?.message || 'Repository status updated',
      };
    } catch (error) {
      this.status = { ...this.status, state: 'error', message: error.message };
      this.output.appendLine(`[refresh] ${error.message}`);
    }
    this.updateStatusBar();
    this.postState();
  }

  async runAction(action) {
    if (!ACTIONS.has(action)) return;
    try {
      await this.runCli([action]);
      await this.refresh();
      vscode.window.showInformationMessage(`Autopilot ${action} completed.`);
    } catch (error) {
      this.output.appendLine(`[${action}] ${error.stack || error.message}`);
      vscode.window.showErrorMessage(`Autopilot ${action} failed: ${error.message}`);
      this.postState();
    }
  }

  updateStatusBar() {
    const icon = this.status.state === 'running' ? '$(play)' : this.status.state === 'paused' ? '$(debug-pause)' : this.status.state === 'error' ? '$(error)' : '$(circle-slash)';
    this.statusBar.text = `${icon} Autopilot: ${this.status.state}`;
    this.statusBar.show();
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.dashboardHtml();
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === 'refresh') return this.refresh();
      if (message.command === 'settings') return this.openSettings();
      if (ACTIONS.has(message.command)) return this.runAction(message.command);
    }, null, this.context.subscriptions);
    this.postState();
  }

  postState() {
    this.view?.webview.postMessage({ type: 'state', status: this.status });
  }

  dashboardHtml() {
    const nonce = String(Date.now());
    return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>
      :root{--accent:#b8ff1f;--muted:var(--vscode-descriptionForeground);--card:var(--vscode-textBlockQuote-background);}
      body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);padding:14px;line-height:1.4}.brand{color:var(--accent);font-weight:700;letter-spacing:1.5px}.sub{color:var(--muted);font-size:11px}.hero{border:1px solid var(--accent);border-radius:8px;padding:12px;margin-bottom:12px}.row{display:flex;justify-content:space-between;align-items:center}.state{font-weight:700;text-transform:uppercase}.running{color:#73c991}.paused{color:#e5c07b}.stopped,.error{color:#f48771}.grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px}.card{background:var(--card);border-radius:6px;padding:9px}.label{color:var(--muted);font-size:10px;text-transform:uppercase}.value{font-size:16px;font-weight:700;margin-top:3px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}button{font:inherit;color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:0;border-radius:4px;padding:6px;cursor:pointer}button:hover{background:var(--vscode-button-hoverBackground)}.wide{grid-column:span 2}</style></head><body>
      <div class="hero"><div class="brand">AUTOPILOT</div><div class="sub">GIT AUTOMATION CONTROL CENTER</div><div class="row" style="margin-top:12px"><strong>Repository Dashboard</strong><span id="state" class="state">LOADING</span></div><div id="message" class="sub">Connecting…</div></div>
      <div class="grid"><div class="card"><div class="label">Branch</div><div id="branch" class="value">—</div></div><div class="card"><div class="label">Pending changes</div><div id="pending" class="value">—</div></div></div>
      <div class="actions"><button data-action="start">Start</button><button data-action="stop">Stop</button><button data-action="pause">Pause</button><button data-action="resume">Resume</button><button data-action="undo">Undo last commit</button><button data-action="refresh">Refresh</button><button class="wide" data-action="settings">Open Settings</button></div>
      <script nonce="${nonce}">const vscode=acquireVsCodeApi();document.querySelectorAll('button').forEach((button)=>button.addEventListener('click',()=>vscode.postMessage({command:button.dataset.action})));window.addEventListener('message',(event)=>{const s=event.data.status||{};const state=document.getElementById('state');state.textContent=(s.state||'loading').toUpperCase();state.className='state '+(s.state||'');document.getElementById('branch').textContent=s.branch||'—';document.getElementById('pending').textContent=String(s.pending??'—');document.getElementById('message').textContent=s.message||'';});</script>
    </body></html>`;
  }

  async openSettings() {
    const root = workspaceRoot();
    if (!root) return vscode.window.showErrorMessage('Open an Autopilot repository first.');
    const panel = vscode.window.createWebviewPanel('autopilot.settings', 'Autopilot Settings', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = await this.settingsHtml(panel.webview, root);
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command !== 'save') return;
      try {
        const file = path.join(root, '.autopilotrc.json');
        const current = JSON.parse(await fs.readFile(file, 'utf8').catch(() => '{}'));
        for (const [key, value] of Object.entries(message.values)) current[key] = value;
        await fs.writeFile(file, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
        vscode.window.showInformationMessage('Autopilot settings saved.');
        panel.dispose();
      } catch (error) { vscode.window.showErrorMessage(`Could not save settings: ${error.message}`); }
    });
  }

  async settingsHtml(webview, root) {
    const current = JSON.parse(await fs.readFile(path.join(root, '.autopilotrc.json'), 'utf8').catch(() => '{}'));
    const nonce = String(Date.now());
    const fields = SETTINGS.map(([key, label, type]) => `<label>${escapeHtml(label)}<input name="${key}" type="${type === 'boolean' ? 'checkbox' : 'number'}" ${type === 'boolean' && current[key] ? 'checked' : ''} value="${type === 'boolean' ? 'true' : escapeHtml(current[key] ?? '')}"></label>`).join('');
    return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);max-width:620px;margin:30px auto;padding:0 20px}h1{color:#b8ff1f}label{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--vscode-widget-border)}input{max-width:180px}button{margin-top:22px;padding:8px 18px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;border-radius:4px}</style></head><body><h1>Autopilot Settings</h1><p>These values are saved to <code>.autopilotrc.json</code> in the workspace.</p><form>${fields}<button>Save settings</button></form><script nonce="${nonce}">const vscode=acquireVsCodeApi();document.querySelector('form').addEventListener('submit',(event)=>{event.preventDefault();const values={};document.querySelectorAll('input').forEach((input)=>values[input.name]=input.type==='checkbox'?input.checked:Number(input.value));vscode.postMessage({command:'save',values});});</script></body></html>`;
  }
}

function activate(context) {
  const controller = new AutopilotController(context);
  controller.activate();
}

function deactivate() {}

module.exports = { activate, deactivate, AutopilotController, parseJsonOutput };

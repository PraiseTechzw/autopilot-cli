import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class LogPanel {
  static currentPanel: LogPanel | undefined;
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private logPath: string;
  private lastSize = 0;
  private pollTimer: NodeJS.Timeout | undefined;

  static createOrShow(context: vscode.ExtensionContext, workspaceRoot: string) {
    if (LogPanel.currentPanel) {
      LogPanel.currentPanel.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'autopilotLog',
      'Autopilot Log',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
      }
    );
    LogPanel.currentPanel = new LogPanel(panel, context, workspaceRoot);
  }

  constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    private workspaceRoot: string
  ) {
    this.panel = panel;
    this.logPath = path.join(workspaceRoot, '.autopilot.log');

    const htmlPath = path.join(context.extensionPath, 'media', 'log.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

    panel.webview.onDidReceiveMessage((msg) => {
      if (msg.command === 'ready') {
        this.sendInitialLog();
        this.startPolling();
      }
      if (msg.command === 'copyAll') {
        vscode.env.clipboard.writeText(msg.text);
        vscode.window.showInformationMessage('Log copied to clipboard.');
      }
    }, undefined, this.disposables);

    panel.onDidDispose(() => {
      LogPanel.currentPanel = undefined;
      if (this.pollTimer) { clearInterval(this.pollTimer); }
      this.disposables.forEach(d => d.dispose());
    });
  }

  private sendInitialLog() {
    if (!fs.existsSync(this.logPath)) {
      this.panel.webview.postMessage({ command: 'updateStatus', status: 'No log file found yet.' });
      return;
    }
    const content = fs.readFileSync(this.logPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    this.lastSize = Buffer.byteLength(content, 'utf-8');
    if (lines.length > 0) {
      this.panel.webview.postMessage({ command: 'appendLines', lines });
    }
    this.updateStatusBar();
  }

  private startPolling() {
    this.pollTimer = setInterval(() => this.pollLog(), 1000);
  }

  private pollLog() {
    if (!fs.existsSync(this.logPath)) { return; }
    try {
      const stat = fs.statSync(this.logPath);
      if (stat.size <= this.lastSize) { return; }

      const fd = fs.openSync(this.logPath, 'r');
      const newBytes = stat.size - this.lastSize;
      const buf = Buffer.alloc(newBytes);
      fs.readSync(fd, buf, 0, newBytes, this.lastSize);
      fs.closeSync(fd);
      this.lastSize = stat.size;

      const newText = buf.toString('utf-8');
      const lines = newText.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        this.panel.webview.postMessage({ command: 'appendLines', lines });
      }
      this.updateStatusBar();
    } catch {
      // race condition — ignore
    }
  }

  private updateStatusBar() {
    const statePath = path.join(this.workspaceRoot, '.autopilot-state.json');
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      this.panel.webview.postMessage({
        command: 'updateStatus',
        status: `Status: ${state.status} | Branch: ${state.branch} | Queue: ${state.queueLength}`
      });
    } catch {
      this.panel.webview.postMessage({
        command: 'updateStatus',
        status: 'Autopilot not running'
      });
    }
  }
}

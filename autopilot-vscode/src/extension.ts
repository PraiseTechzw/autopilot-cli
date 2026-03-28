import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { StateReader } from './stateReader';
import { CliRunner } from './cliRunner';
import { StatusBarItem } from './statusBar';
import { AutopilotProvider } from './sidebar/AutopilotProvider';
import { SettingsPanel } from './webview/SettingsPanel';
import { LogPanel } from './webview/LogPanel';
import { Notifier } from './notifier';
import { AutopilotState } from './stateReader';

let stateReader: StateReader | undefined;
let cliRunner: CliRunner | undefined;
let statusBar: StatusBarItem | undefined;
let provider: AutopilotProvider | undefined;
let notifier: Notifier | undefined;

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) { return; }

  // Check for .autopilotrc.json
  const rcPath = path.join(workspaceRoot, '.autopilotrc.json');
  const hasConfig = fs.existsSync(rcPath);

  if (!hasConfig) {
    vscode.window.showInformationMessage(
      'No .autopilotrc.json found. Run autopilot init in your terminal to get started.',
      'Open Terminal'
    ).then(action => {
      if (action === 'Open Terminal') {
        vscode.commands.executeCommand('workbench.action.terminal.new');
      }
    });
  }

  // Instantiate core modules
  cliRunner = new CliRunner(workspaceRoot, context);
  stateReader = new StateReader(workspaceRoot, context);
  statusBar = new StatusBarItem(context);
  provider = new AutopilotProvider(context);
  notifier = new Notifier(context, cliRunner);

  // Register sidebar tree view
  const treeView = vscode.window.createTreeView('autopilotSidebar', {
    treeDataProvider: provider,
    showCollapseAll: false
  });
  context.subscriptions.push(treeView);

  // Show status bar
  statusBar.show();

  // Wire up state changes
  stateReader.on('stateChange', (state: AutopilotState) => {
    statusBar!.update(state);
    provider!.refresh(state);
  });

  stateReader.on('conflictDetected', (state: AutopilotState) => {
    notifier!.onConflictDetected(state);
  });

  stateReader.on('pushSucceeded', (state: AutopilotState) => {
    notifier!.onPushSucceeded(state);
  });

  stateReader.on('pushFailed', (state: AutopilotState) => {
    notifier!.onPushFailed(state);
  });

  stateReader.on('processExited', () => {
    notifier!.onProcessExited();
  });

  // Start polling
  stateReader.start();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('autopilot.start', async () => {
      await cliRunner!.start();
    }),
    vscode.commands.registerCommand('autopilot.stop', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Stop Autopilot?', { modal: true }, 'Stop'
      );
      if (confirm === 'Stop') { await cliRunner!.stop(); }
    }),
    vscode.commands.registerCommand('autopilot.pause', async () => {
      await cliRunner!.pause();
      vscode.window.showInformationMessage('Autopilot paused.');
    }),
    vscode.commands.registerCommand('autopilot.resume', async () => {
      await cliRunner!.resume();
      vscode.window.showInformationMessage('Autopilot resumed.');
    }),
    vscode.commands.registerCommand('autopilot.undo', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Undo the last autopilot commit? This cannot be undone.',
        { modal: true }, 'Undo'
      );
      if (confirm === 'Undo') {
        const result = await cliRunner!.undo();
        if (result.success) {
          vscode.window.showInformationMessage(`Undone: ${result.message}`);
        } else {
          vscode.window.showErrorMessage(`Undo failed: ${result.message}`);
        }
      }
    }),
    vscode.commands.registerCommand('autopilot.openSettings', () => {
      SettingsPanel.createOrShow(context, workspaceRoot, cliRunner!);
    }),
    vscode.commands.registerCommand('autopilot.openLog', () => {
      LogPanel.createOrShow(context, workspaceRoot);
    }),
    vscode.commands.registerCommand('autopilot.runDoctor', async () => {
      const output = await cliRunner!.runDoctor();
      const channel = vscode.window.createOutputChannel('Autopilot Doctor');
      channel.clear();
      channel.appendLine(output);
      channel.show();
    }),
    vscode.commands.registerCommand('autopilot.showStatus', async () => {
      const output = await cliRunner!.getStatus();
      const channel = vscode.window.createOutputChannel('Autopilot Status');
      channel.clear();
      channel.appendLine(output);
      channel.show();
    }),
    vscode.commands.registerCommand('autopilot.init', async () => {
      await cliRunner!.run('init', []);
      SettingsPanel.createOrShow(context, workspaceRoot, cliRunner!);
    })
  );

  // Ask to start if config exists but process isn't running
  if (hasConfig) {
    setTimeout(async () => {
      const state = stateReader!.getLastState();
      if (!state || state.status === 'stopped') {
        const action = await vscode.window.showInformationMessage(
          'Autopilot is not running. Start it now?',
          'Start', 'Not now'
        );
        if (action === 'Start') { await cliRunner!.start(); }
      }
    }, 2000);
  }
}

export function deactivate() {
  stateReader?.stop();
  // Do NOT kill the CLI process — it keeps running after VS Code closes
}

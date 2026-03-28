import * as vscode from 'vscode';
import { AutopilotState } from './stateReader';
import { CliRunner } from './cliRunner';

export class Notifier {
  constructor(
    private context: vscode.ExtensionContext,
    private cliRunner: CliRunner
  ) {}

  onPushSucceeded(state: AutopilotState) {
    if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) { return; }
    const msg = state.lastCommit?.message ?? 'commit';
    vscode.window.showInformationMessage(
      `Autopilot pushed: "${msg}"`,
      'View log'
    ).then(action => {
      if (action === 'View log') {
        vscode.commands.executeCommand('autopilot.openLog');
      }
    });
  }

  onPushFailed(_state: AutopilotState) {
    if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) { return; }
    vscode.window.showWarningMessage(
      'Autopilot: push failed — added to retry queue',
      'View queue', 'Open log'
    ).then(action => {
      if (action === 'Open log') {
        vscode.commands.executeCommand('autopilot.openLog');
      }
    });
  }

  onConflictDetected(state: AutopilotState) {
    if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) { return; }
    vscode.window.showErrorMessage(
      `Autopilot paused: merge conflict detected on ${state.branch}. Resolve manually.`,
      'Open terminal', 'View log'
    ).then(action => {
      if (action === 'Open terminal') {
        vscode.commands.executeCommand('workbench.action.terminal.new');
      } else if (action === 'View log') {
        vscode.commands.executeCommand('autopilot.openLog');
      }
    });
  }

  onProcessExited() {
    if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) { return; }
    vscode.window.showWarningMessage(
      'Autopilot stopped unexpectedly.',
      'Restart', 'Dismiss'
    ).then(action => {
      if (action === 'Restart') {
        this.cliRunner.start();
      }
    });
  }
}

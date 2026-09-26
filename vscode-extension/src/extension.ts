import * as vscode from 'vscode';
import { AutopilotCli, AutopilotCliError } from './cli';
import { AutopilotDashboard } from './dashboard';

export function activate(context: vscode.ExtensionContext): void {
  const cli = new AutopilotCli();
  const dashboard = new AutopilotDashboard(cli);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('autopilot.dashboard', dashboard));
  context.subscriptions.push(
    vscode.commands.registerCommand('autopilot.refresh', () => dashboard.refresh()),
    vscode.commands.registerCommand('autopilot.verify', () => dashboard.dispatch('verify')),
    vscode.commands.registerCommand('autopilot.review', () => dashboard.dispatch('review')),
    vscode.commands.registerCommand('autopilot.resume', () => dashboard.dispatch('resume')),
    vscode.commands.registerCommand('autopilot.executeTask', () => dashboard.dispatch('execute')),
    vscode.commands.registerCommand('autopilot.checkpoint', () => dashboard.dispatch('checkpoint')),
    vscode.commands.registerCommand('autopilot.restore', () => dashboard.dispatch('restore')),
    vscode.commands.registerCommand('autopilot.history', () => dashboard.dispatch('history')),
    vscode.commands.registerCommand('autopilot.configure', () => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:praisetechzw.autopilot-dev')),
    vscode.commands.registerCommand('autopilot.proposeFix', () => dashboard.dispatch('proposeFix')),
    vscode.commands.registerCommand('autopilot.ciStatus', () => dashboard.dispatch('ciStatus'))
  );
  void cli.assertCompatible().catch(error => {
    const message = error instanceof AutopilotCliError ? error.message : String(error);
    void vscode.window.showWarningMessage(message, 'Open Settings').then(choice => { if (choice === 'Open Settings') void vscode.commands.executeCommand('workbench.action.openSettings', '@ext:praisetechzw.autopilot-dev'); });
  });
}

export function deactivate(): void { /* subprocesses are short-lived and owned by the CLI */ }

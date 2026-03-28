import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CliRunner } from '../cliRunner';

export class SettingsPanel {
  static currentPanel: SettingsPanel | undefined;
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  static createOrShow(
    context: vscode.ExtensionContext,
    workspaceRoot: string,
    cli: CliRunner
  ) {
    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'autopilotSettings',
      'Autopilot Settings',
      vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] }
    );
    SettingsPanel.currentPanel = new SettingsPanel(panel, context, workspaceRoot, cli);
  }

  constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    private workspaceRoot: string,
    private cli: CliRunner
  ) {
    this.panel = panel;

    const htmlPath = path.join(context.extensionPath, 'media', 'settings.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

    panel.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case 'ready':
          this.sendConfig();
          break;
        case 'save':
          await this.saveConfig(msg.config);
          break;
        case 'pickFolder': {
          const result = await vscode.window.showOpenDialog({
            canSelectFolders: true, canSelectFiles: false, canSelectMany: false
          });
          if (result?.[0]) {
            panel.webview.postMessage({
              command: 'loadConfig',
              config: { ...(await this.readConfig()), watchPath: result[0].fsPath }
            });
          }
          break;
        }
      }
    }, undefined, this.disposables);

    panel.onDidDispose(() => {
      SettingsPanel.currentPanel = undefined;
      this.disposables.forEach(d => d.dispose());
    });
  }

  private async readConfig(): Promise<Record<string, unknown>> {
    const rcPath = path.join(this.workspaceRoot, '.autopilotrc.json');
    try {
      return JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
    } catch {
      return {};
    }
  }

  private async sendConfig() {
    const config = await this.readConfig();
    config.watchPath = this.workspaceRoot;
    this.panel.webview.postMessage({ command: 'loadConfig', config });
  }

  private async saveConfig(incoming: Record<string, unknown>) {
    const rcPath = path.join(this.workspaceRoot, '.autopilotrc.json');
    try {
      const existing = await this.readConfig();
      const merged = { ...existing, ...incoming };
      fs.writeFileSync(rcPath, JSON.stringify(merged, null, 2));
      this.panel.webview.postMessage({ command: 'saveSuccess' });

      const action = await vscode.window.showInformationMessage(
        'Settings saved. Restart autopilot to apply changes.',
        'Restart now'
      );
      if (action === 'Restart now') {
        await this.cli.stop();
        setTimeout(() => this.cli.start(), 1500);
      }
    } catch (err: any) {
      this.panel.webview.postMessage({ command: 'saveError', error: err.message });
    }
  }
}

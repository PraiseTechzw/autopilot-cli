import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class CliRunner {
  private workspaceRoot: string;
  private context: vscode.ExtensionContext;

  constructor(workspaceRoot: string, context: vscode.ExtensionContext) {
    this.workspaceRoot = workspaceRoot;
    this.context = context;
  }

  private getCli(): string {
    return vscode.workspace
      .getConfiguration('autopilot')
      .get('cliPath', 'autopilot');
  }

  /** Generic command runner, returns stdout */
  async run(command: string, args: string[] = [], timeout = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
      const cli = this.getCli();
      const child = cp.spawn(cli, [command, ...args], {
        cwd: this.workspaceRoot,
        shell: false,
        timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
      child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

      child.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          vscode.window.showErrorMessage(
            'Autopilot CLI not found. Install it with: npm install -g autopilot-cli',
            'Copy install command'
          ).then(action => {
            if (action === 'Copy install command') {
              vscode.env.clipboard.writeText('npm install -g autopilot-cli');
            }
          });
        }
        reject(err);
      });

      child.on('close', (code: number) => {
        if (code !== 0 && !stdout) {
          reject(new Error(stderr || `Exit code ${code}`));
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }

  /** Start autopilot detached (doesn't die when VS Code closes) */
  async start(): Promise<void> {
    try {
      const cli = this.getCli();
      const child = cp.spawn(cli, ['start'], {
        cwd: this.workspaceRoot,
        detached: true,
        stdio: 'ignore',
        shell: false
      });
      child.unref();

      // Wait up to 3 seconds for state file to appear
      const statePath = path.join(this.workspaceRoot, '.autopilot-state.json');
      let waited = 0;
      await new Promise<void>(resolve => {
        const check = setInterval(() => {
          waited += 500;
          if (fs.existsSync(statePath) || waited >= 3000) {
            clearInterval(check);
            resolve();
          }
        }, 500);
      });

      if (!fs.existsSync(statePath)) {
        vscode.window.showWarningMessage(
          'Autopilot may not have started — no state file detected after 3s.'
        );
      } else {
        vscode.window.showInformationMessage('Autopilot started.');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to start autopilot: ${err.message}`);
    }
  }

  async stop(): Promise<void> {
    try {
      const statePath = path.join(this.workspaceRoot, '.autopilot-state.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        if (state.pid) {
          try { process.kill(state.pid, 'SIGTERM'); } catch { /* already dead */ }
        }
      }
      await this.run('stop', []).catch(() => {});
      vscode.window.showInformationMessage('Autopilot stopped.');
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to stop autopilot: ${err.message}`);
    }
  }

  async undo(): Promise<{ success: boolean; message: string }> {
    try {
      const output = await this.run('undo', []);
      return { success: true, message: output.trim() };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async pause(): Promise<void> {
    const pausePath = path.join(this.workspaceRoot, '.autopilot-pause');
    fs.writeFileSync(pausePath, '');
    await this.run('pause', []).catch(() => {});
  }

  async resume(): Promise<void> {
    const pausePath = path.join(this.workspaceRoot, '.autopilot-pause');
    if (fs.existsSync(pausePath)) { fs.unlinkSync(pausePath); }
    await this.run('resume', []).catch(() => {});
  }

  async runDoctor(): Promise<string> {
    try {
      return await this.run('doctor', [], 60000);
    } catch (err: any) {
      return `Doctor failed: ${err.message}`;
    }
  }

  async getStatus(): Promise<string> {
    try {
      return await this.run('status', []);
    } catch (err: any) {
      return `Status failed: ${err.message}`;
    }
  }
}

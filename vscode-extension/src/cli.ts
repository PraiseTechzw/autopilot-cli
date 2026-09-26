import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { buildCliArgs, classifyError, parseJson, versionAtLeast } from './protocol';

export class AutopilotCliError extends Error {
  constructor(message: string, readonly kind: 'not-found' | 'version' | 'auth' | 'git' | 'provider' | 'command' = 'command', readonly exitCode?: number) {
    super(message);
    this.name = 'AutopilotCliError';
  }
}

export class AutopilotCli {
  constructor(private readonly output: vscode.OutputChannel = vscode.window.createOutputChannel('Autopilot')) {}

  private get command(): string {
    return vscode.workspace.getConfiguration('autopilot').get<string>('command', 'autopilot');
  }

  private get cwd(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  }

  async run<T = unknown>(args: string[], options: { json?: boolean; ai?: boolean } = {}): Promise<T> {
    const finalArgs = buildCliArgs(args, options.json, options.ai);
    this.output.appendLine(`$ ${this.command} ${finalArgs.join(' ')}`);
    return new Promise<T>((resolve, reject) => {
      const child = spawn(this.command, finalArgs, { cwd: this.cwd, shell: false, windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      child.on('error', (error: NodeJS.ErrnoException) => {
          const kind = error.code === 'ENOENT' ? 'not-found' : 'command';
        reject(new AutopilotCliError(`Autopilot CLI unavailable: ${this.command}`, kind));
      });
      child.on('close', (code) => {
        this.output.appendLine(stdout.trim() || stderr.trim());
        if (code !== 0) {
          const text = (stderr || stdout).trim() || `Autopilot exited with code ${code}`;
          reject(new AutopilotCliError(text, classifyError(text), code ?? undefined));
          return;
        }
        if (!options.json) { resolve(stdout.trim() as T); return; }
        try { resolve(parseJson<T>(stdout, args.join(' '))); }
        catch (error) { reject(new AutopilotCliError(error instanceof Error ? error.message : String(error))); }
      });
    });
  }

  async version(): Promise<string> {
    return this.run<string>(['version']);
  }

  async assertCompatible(): Promise<void> {
    const actual = await this.version();
    const minimum = vscode.workspace.getConfiguration('autopilot').get<string>('minimumVersion', '1.0.0');
    if (!versionAtLeast(actual, minimum)) {
      throw new AutopilotCliError(`Autopilot ${minimum}+ is required; found ${actual}`, 'version');
    }
  }

  workspacePath(): string { return path.resolve(this.cwd); }
}

import * as vscode from 'vscode';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { AutopilotCli, AutopilotCliError } from './cli';
import { parseJson } from './protocol';
import type { Analysis, AuditEvent, CiStatus, ResumeContext, Review, Status, Verification } from './models';

export class AutopilotDashboard implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private message?: string;
  private status?: Status;
  private verification?: Verification;
  private review?: Review;
  private resume?: ResumeContext;
  private analysis?: Analysis;
  private ci?: CiStatus;
  private version = '';

  constructor(private readonly cli: AutopilotCli) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.onDidReceiveMessage(message => this.handle(message));
    void this.refresh();
  }

  dispatch(type: string): Promise<void> { return this.handle({ type }); }

  async refresh(): Promise<void> {
    try {
      await this.cli.assertCompatible();
      this.version = await this.cli.version();
      [this.status, this.resume, this.verification] = await Promise.all([
        this.cli.run<Status>(['status'], { json: true }),
        this.cli.run<ResumeContext>(['resume'], { json: true }),
        this.cli.run<Verification>(['verify'], { json: true })
      ]);
      this.analysis = await this.cli.run<Analysis>(['analyze'], { json: true });
      this.message = undefined;
    } catch (error) { this.message = this.describe(error); }
    this.render();
  }

  private async handle(message: { type: string; task?: string }): Promise<void> {
    try {
      if (message.type === 'refresh') return this.refresh();
      if (message.type === 'verify') { this.verification = await this.cli.run<Verification>(['verify'], { json: true }); }
      else if (message.type === 'review') { this.review = await this.cli.run<Review>(['review', '--staged'], { json: true, ai: this.aiEnabled() }); }
      else if (message.type === 'resume') { this.resume = await this.cli.run<ResumeContext>(['resume'], { json: true }); }
      else if (message.type === 'checkpoint') { await this.cli.run<string>(['checkpoint', '--label', 'vscode-sidebar']); vscode.window.showInformationMessage('Autopilot checkpoint created.'); }
      else if (message.type === 'restore') { await this.confirmAndRun(['undo'], 'Restore the latest applied Autopilot patch?'); }
      else if (message.type === 'history') { const raw = await this.cli.run<string>(['replay']); const events = raw.split('\n').filter(Boolean).map(line => parseJson<AuditEvent>(line, 'replay')); this.showHistory(events); }
      else if (message.type === 'proposeFix') await this.proposeFix();
      else if (message.type === 'ciStatus') await this.ciStatus();
      else if (message.type === 'execute') await this.executeTask(message.task);
      else if (message.type === 'configure') await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:praisetechzw.autopilot-dev');
      this.message = undefined;
    } catch (error) { this.message = this.describe(error); }
    this.render();
  }

  private async executeTask(task?: string): Promise<void> {
    const value = task ?? await vscode.window.showInputBox({ prompt: 'Describe the bounded development task', placeHolder: 'e.g. Add validation for the login form' });
    if (!value) return;
    const ai = this.aiEnabled();
    if (!ai) throw new AutopilotCliError('Enable autopilot.aiEnabled before requesting an AI task.', 'provider');
    const confirm = await vscode.window.showWarningMessage('Autopilot will generate and apply a checkpointed patch. Review the result and use Restore if verification fails.', { modal: true }, 'Approve task', 'Cancel');
    if (confirm !== 'Approve task') return;
    const max = vscode.workspace.getConfiguration('autopilot').get<number>('defaultMaxIterations', 3);
    await this.cli.run(['execute-task', value, '--approve', '--allow-medium', '--max-iterations', String(max)], { ai: true });
    vscode.window.showInformationMessage('Autopilot task completed through the guarded Python workflow.');
    await this.refresh();
  }

  private async proposeFix(): Promise<void> {
    const owner = await vscode.window.showInputBox({ prompt: 'GitHub owner', placeHolder: 'acme' });
    const repo = owner ? await vscode.window.showInputBox({ prompt: 'GitHub repository', placeHolder: 'demo' }) : undefined;
    const run = repo ? await vscode.window.showInputBox({ prompt: 'Failed workflow run ID', placeHolder: '123' }) : undefined;
    if (!owner || !repo || !run) return;
    const proposal = await this.cli.run<Record<string, unknown>>(['propose-fix', '--owner', owner, '--repo', repo, '--run-id', run], { json: true, ai: this.aiEnabled() });
    const files = Array.isArray(proposal.files) ? proposal.files.join(', ') : 'unknown files';
    const risk = String(proposal.risk ?? 'medium').toUpperCase();
    const decision = await vscode.window.showWarningMessage(`${String(proposal.title ?? 'CI fix')} · ${risk}\n${String(proposal.rationale ?? '')}\nFiles: ${files}`, { modal: true }, 'Reject', 'Approve & apply', 'Copy patch');
    if (decision === 'Approve & apply' && typeof proposal.patch === 'string') {
      const patchPath = path.join(this.cli.workspacePath(), '.autopilot', 'vscode-proposal.patch');
      await fs.mkdir(path.dirname(patchPath), { recursive: true });
      await fs.writeFile(patchPath, proposal.patch, 'utf8');
      const permission = risk === 'HIGH' ? '--allow-high' : '--allow-medium';
      await this.cli.run(['apply-fix', patchPath, '--approve', '--risk', risk.toLowerCase(), permission]);
      vscode.window.showInformationMessage('Approved patch applied by Autopilot with checkpoint and secret scanning.');
      await this.refresh();
      return;
    }
    if (decision === 'Copy patch' && typeof proposal.patch === 'string') {
      await vscode.env.clipboard.writeText(proposal.patch);
      vscode.window.showInformationMessage('Patch copied for review. Apply it through Autopilot with explicit --approve and risk permission flags.');
    }
  }

  private async ciStatus(): Promise<void> {
    const owner = await vscode.window.showInputBox({ prompt: 'GitHub owner', placeHolder: 'acme' });
    const repo = owner ? await vscode.window.showInputBox({ prompt: 'GitHub repository', placeHolder: 'demo' }) : undefined;
    if (!owner || !repo) return;
    this.ci = await this.cli.run<CiStatus>(['github', 'ci-status', '--owner', owner, '--repo', repo], { json: true });
  }

  private async confirmAndRun(args: string[], prompt: string): Promise<void> {
    const answer = await vscode.window.showWarningMessage(prompt, { modal: true }, 'Continue', 'Cancel');
    if (answer === 'Continue') await this.cli.run(args);
  }

  private aiEnabled(): boolean { return vscode.workspace.getConfiguration('autopilot').get<boolean>('aiEnabled', false); }

  private showHistory(events: AuditEvent[]): void {
    const panel = vscode.window.createWebviewPanel('autopilotHistory', 'Autopilot Audit History', vscode.ViewColumn.Beside, { enableScripts: false });
    panel.webview.html = `<html><body><h2>Autopilot audit history</h2>${events.map(event => `<p><strong>${escapeHtml(event.event)}</strong><br><small>${escapeHtml(event.timestamp)}</small></p>`).join('') || '<p>No recorded events.</p>'}</body></html>`;
  }

  private describe(error: unknown): string {
    if (error instanceof AutopilotCliError) return error.message;
    return error instanceof Error ? error.message : String(error);
  }

  private render(): void {
    if (!this.view) return;
    this.view.webview.html = html(this.status, this.resume, this.verification, this.review, this.analysis, this.ci, this.version, this.message);
  }
}

function escapeHtml(value: unknown): string { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char)); }
function html(status?: Status, resume?: ResumeContext, verification?: Verification, review?: Review, analysis?: Analysis, ci?: CiStatus, version = '', message?: string): string {
  const changes = status?.changes?.length ?? 0;
  const checks = verification ? `${verification.checks.filter(check => check.passed).length}/${verification.checks.length} checks passing` : 'Not run';
  const reviewText = review ? `${review.findings.length} finding(s)${review.high_risk ? ' · HIGH RISK' : ''}` : 'Not run';
  const projectText = analysis ? `${(analysis.languages ?? []).join(', ') || 'detected'} · ${(analysis.frameworks ?? []).join(', ') || 'no framework'}` : 'Not run';
  const ciText = ci ? `${ci.runs.length} run(s) · ${ci.runs.filter(run => run.conclusion === 'success').length} passing` : 'Not checked';
  return `<!doctype html><html><head><meta charset="UTF-8"><style>
  body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);padding:14px;font-size:12px}h1{font-size:17px;margin:0 0 4px}.muted{color:var(--vscode-descriptionForeground)}.hero{padding:4px 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.card{background:var(--vscode-editor-inactiveSelectionBackground);border:1px solid var(--vscode-widget-border);border-radius:6px;padding:10px}.label{color:var(--vscode-descriptionForeground);font-size:10px;text-transform:uppercase;letter-spacing:.06em}.value{font-size:14px;margin-top:5px}.ok{color:var(--vscode-testing-iconPassed)}.warn{color:var(--vscode-editorWarning-foreground)}button{width:100%;margin-top:8px;padding:6px;border:1px solid var(--vscode-button-border);color:var(--vscode-button-foreground);background:var(--vscode-button-background);border-radius:3px}button.secondary{color:var(--vscode-foreground);background:transparent}.error{border-left:3px solid var(--vscode-errorForeground);padding:8px;background:var(--vscode-inputValidation-errorBackground);margin:8px 0}.section{margin-top:16px;font-weight:600}
  </style></head><body><div class="hero"><h1>Autopilot</h1><div class="muted">Guarded AI development agent · ${escapeHtml(version || 'checking CLI…')}</div></div>${message ? `<div class="error">${escapeHtml(message)}<button class="secondary" data-action="configure">Open configuration</button></div>` : ''}<div class="grid"><div class="card"><div class="label">Branch</div><div class="value">${escapeHtml(status?.branch ?? resume?.branch ?? '—')}</div></div><div class="card"><div class="label">Working tree</div><div class="value ${status?.clean ? 'ok' : 'warn'}">${status ? (status.clean ? 'Clean' : `${changes} change(s)`) : '—'}</div></div><div class="card"><div class="label">Verification</div><div class="value">${escapeHtml(checks)}</div></div><div class="card"><div class="label">Code review</div><div class="value">${escapeHtml(reviewText)}</div></div></div><div class="card"><div class="label">Project map</div><div class="value">${escapeHtml(projectText)}</div></div><div class="card"><div class="label">CI / PR</div><div class="value">${escapeHtml(ciText)}</div></div></div><div class="section">Safe actions</div><button data-action="verify">Run verification</button><button data-action="review">Review staged changes</button><button data-action="resume" class="secondary">Resume project context</button><button data-action="execute" class="secondary">Execute bounded AI task</button><button data-action="proposeFix" class="secondary">Propose CI fix</button><button data-action="ciStatus" class="secondary">Check CI status</button><div class="section">Recovery & history</div><button data-action="checkpoint" class="secondary">Create checkpoint</button><button data-action="restore" class="secondary">Restore latest AI patch</button><button data-action="history" class="secondary">Open audit history</button><button data-action="refresh" class="secondary">Refresh dashboard</button><script>const vscode=acquireVsCodeApi();document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>vscode.postMessage({type:b.dataset.action})));</script></body></html>`;
}

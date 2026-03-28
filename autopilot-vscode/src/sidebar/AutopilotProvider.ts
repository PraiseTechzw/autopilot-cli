import * as vscode from 'vscode';
import { AutopilotState } from '../stateReader';
import {
  StatusBarTreeItem, ActionItem, GroupItem,
  formatUptime, timeAgo, statusIcon
} from './TreeItems';

export class AutopilotProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private state: AutopilotState | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(state: AutopilotState | undefined) {
    this.state = state;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (element) { return this.getGroupChildren(element); }
    return this.getRootItems();
  }

  private getRootItems(): vscode.TreeItem[] {
    return [
      new GroupItem('Status', 'pulse'),
      new GroupItem('Repository', 'repo'),
      new GroupItem('Last Activity', 'history'),
      new GroupItem('Queue', 'clock'),
      new GroupItem('Actions', 'zap'),
    ];
  }

  private getGroupChildren(element: vscode.TreeItem): vscode.TreeItem[] {
    const s = this.state;
    const label = element.label as string;

    switch (label) {
      case 'Status': {
        const icon = statusIcon(s);
        const statusLabel = s ? this.statusLabel(s.status) : 'Not running';
        const contextVal = s?.status === 'watching' ? 'statusWatching'
          : s?.status === 'paused' ? 'statusPaused' : 'statusOther';

        return [
          new StatusBarTreeItem(
            statusLabel,
            contextVal,
            vscode.TreeItemCollapsibleState.None,
            icon.id,
            s ? `Status: ${s.status}` : 'Autopilot is not running',
            icon.color
          ),
          new StatusBarTreeItem(
            s ? `Uptime: ${formatUptime(s.uptime)}` : 'Uptime: —',
            'uptime',
            vscode.TreeItemCollapsibleState.None,
            'watch'
          )
        ];
      }

      case 'Repository': {
        const branchLabel = s
          ? `Branch: ${s.branch}${s.isProtected ? '  🔒 PROTECTED' : ''}`
          : 'Branch: unknown';
        return [
          new StatusBarTreeItem(branchLabel, 'branch', vscode.TreeItemCollapsibleState.None, 'git-branch',
            s?.isProtected ? 'Protected branch — push blocked unless allowPushToProtected is set' : undefined),
          new StatusBarTreeItem(
            s ? `Watch path: ${s.watchPath}` : 'Watch path: —',
            'watchPath',
            vscode.TreeItemCollapsibleState.None,
            'folder'
          )
        ];
      }

      case 'Last Activity': {
        const commitLabel = s?.lastCommit
          ? `Committed: "${s.lastCommit.message}" (${timeAgo(s.lastCommit.timestamp)})`
          : 'No commits yet';
        const pushLabel = s?.lastPush
          ? s.lastPush.success
            ? `Pushed: succeeded (${timeAgo(s.lastPush.timestamp)})`
            : `Push: failed — queued (${timeAgo(s.lastPush.timestamp)})`
          : 'No pushes yet';
        const pushIcon = s?.lastPush?.success ? 'check' : (s?.lastPush ? 'error' : 'dash');

        return [
          new StatusBarTreeItem(commitLabel, 'lastCommit', vscode.TreeItemCollapsibleState.None, 'git-commit',
            s?.lastCommit?.message),
          new StatusBarTreeItem(pushLabel, 'lastPush', vscode.TreeItemCollapsibleState.None, pushIcon)
        ];
      }

      case 'Queue': {
        const q = s?.queueLength ?? 0;
        const qLabel = q === 0 ? '0 pending jobs' : `${q} job${q > 1 ? 's' : ''} waiting...`;
        return [
          new StatusBarTreeItem(qLabel, 'queue', vscode.TreeItemCollapsibleState.None, 'clock',
            q > 0 ? 'Retry queue — jobs will push when network is available' : undefined)
        ];
      }

      case 'Actions': {
        const isRunning = !!s && s.status !== 'stopped';
        const isPaused = s?.status === 'paused';
        return [
          isRunning
            ? new ActionItem('Stop Autopilot',    'actionStop',     'autopilot.stop',     'debug-stop',   'Stop the autopilot watcher')
            : new ActionItem('Start Autopilot',   'actionStart',    'autopilot.start',    'play',         'Start the autopilot watcher'),
          isPaused
            ? new ActionItem('Resume',            'actionResume',   'autopilot.resume',   'debug-start',  'Resume watching')
            : new ActionItem('Pause',             'actionPause',    'autopilot.pause',    'debug-pause',  'Pause watching temporarily'),
          new ActionItem('Undo Last Commit',       'actionUndo',     'autopilot.undo',     'discard',      'Revert the most recent autopilot commit'),
          new ActionItem('Open Settings',          'actionSettings', 'autopilot.openSettings', 'settings-gear', 'Configure autopilot'),
          new ActionItem('Run Doctor',             'actionDoctor',   'autopilot.runDoctor','pulse',        'Diagnose autopilot health'),
          new ActionItem('Open Log',               'actionLog',      'autopilot.openLog',  'output',       'View live autopilot log'),
        ];
      }

      default:
        return [];
    }
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      watching:   '$(eye) Watching',
      paused:     '$(debug-pause) Paused',
      conflict:   '$(warning) Conflict detected!',
      committing: '$(git-commit) Committing...',
      pushing:    '$(cloud-upload) Pushing...',
      stopped:    '$(circle-slash) Stopped'
    };
    return map[status] ?? status;
  }
}

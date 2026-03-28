import * as vscode from 'vscode';
import { AutopilotState } from '../stateReader';

export class StatusBarTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly contextValue: string,
    collapsible: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    iconId?: string,
    tooltip?: string,
    color?: vscode.ThemeColor
  ) {
    super(label, collapsible);
    this.contextValue = contextValue;
    if (iconId) {
      this.iconPath = color
        ? new vscode.ThemeIcon(iconId, color)
        : new vscode.ThemeIcon(iconId);
    }
    if (tooltip) { this.tooltip = tooltip; }
  }
}

export class ActionItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly contextValue: string,
    commandId: string,
    iconId: string,
    tooltip?: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = contextValue;
    this.command = { command: commandId, title: label };
    this.iconPath = new vscode.ThemeIcon(iconId);
    if (tooltip) { this.tooltip = tooltip; }
  }
}

export class GroupItem extends vscode.TreeItem {
  constructor(label: string, iconId?: string) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'group';
    if (iconId) { this.iconPath = new vscode.ThemeIcon(iconId); }
  }
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) { return `${seconds}s`; }
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  if (h > 0) { return `${h}h ${m}m`; }
  return `${m}m`;
}

export function timeAgo(isoString: string | undefined): string {
  if (!isoString) { return 'never'; }
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) { return `${diff}s ago`; }
  if (diff < 3600) { return `${Math.floor(diff / 60)}m ago`; }
  return `${Math.floor(diff / 3600)}h ago`;
}

export function statusIcon(state: AutopilotState | undefined): { id: string; color?: vscode.ThemeColor } {
  if (!state) { return { id: 'circle-slash' }; }
  switch (state.status) {
    case 'watching':    return { id: 'eye' };
    case 'paused':      return { id: 'debug-pause' };
    case 'conflict':    return { id: 'warning', color: new vscode.ThemeColor('list.warningForeground') };
    case 'committing':  return { id: 'git-commit' };
    case 'pushing':     return { id: 'cloud-upload' };
    default:            return { id: 'circle-slash' };
  }
}

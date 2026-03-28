"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutopilotProvider = void 0;
const vscode = __importStar(require("vscode"));
const TreeItems_1 = require("./TreeItems");
class AutopilotProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh(state) {
        this.state = state;
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return this.getGroupChildren(element);
        }
        return this.getRootItems();
    }
    getRootItems() {
        return [
            new TreeItems_1.GroupItem('Status', 'pulse'),
            new TreeItems_1.GroupItem('Repository', 'repo'),
            new TreeItems_1.GroupItem('Last Activity', 'history'),
            new TreeItems_1.GroupItem('Queue', 'clock'),
            new TreeItems_1.GroupItem('Actions', 'zap'),
        ];
    }
    getGroupChildren(element) {
        const s = this.state;
        const label = element.label;
        switch (label) {
            case 'Status': {
                const icon = (0, TreeItems_1.statusIcon)(s);
                const statusLabel = s ? this.statusLabel(s.status) : 'Not running';
                const contextVal = s?.status === 'watching' ? 'statusWatching'
                    : s?.status === 'paused' ? 'statusPaused' : 'statusOther';
                return [
                    new TreeItems_1.StatusBarTreeItem(statusLabel, contextVal, vscode.TreeItemCollapsibleState.None, icon.id, s ? `Status: ${s.status}` : 'Autopilot is not running', icon.color),
                    new TreeItems_1.StatusBarTreeItem(s ? `Uptime: ${(0, TreeItems_1.formatUptime)(s.uptime)}` : 'Uptime: —', 'uptime', vscode.TreeItemCollapsibleState.None, 'watch')
                ];
            }
            case 'Repository': {
                const branchLabel = s
                    ? `Branch: ${s.branch}${s.isProtected ? '  🔒 PROTECTED' : ''}`
                    : 'Branch: unknown';
                return [
                    new TreeItems_1.StatusBarTreeItem(branchLabel, 'branch', vscode.TreeItemCollapsibleState.None, 'git-branch', s?.isProtected ? 'Protected branch — push blocked unless allowPushToProtected is set' : undefined),
                    new TreeItems_1.StatusBarTreeItem(s ? `Watch path: ${s.watchPath}` : 'Watch path: —', 'watchPath', vscode.TreeItemCollapsibleState.None, 'folder')
                ];
            }
            case 'Last Activity': {
                const commitLabel = s?.lastCommit
                    ? `Committed: "${s.lastCommit.message}" (${(0, TreeItems_1.timeAgo)(s.lastCommit.timestamp)})`
                    : 'No commits yet';
                const pushLabel = s?.lastPush
                    ? s.lastPush.success
                        ? `Pushed: succeeded (${(0, TreeItems_1.timeAgo)(s.lastPush.timestamp)})`
                        : `Push: failed — queued (${(0, TreeItems_1.timeAgo)(s.lastPush.timestamp)})`
                    : 'No pushes yet';
                const pushIcon = s?.lastPush?.success ? 'check' : (s?.lastPush ? 'error' : 'dash');
                return [
                    new TreeItems_1.StatusBarTreeItem(commitLabel, 'lastCommit', vscode.TreeItemCollapsibleState.None, 'git-commit', s?.lastCommit?.message),
                    new TreeItems_1.StatusBarTreeItem(pushLabel, 'lastPush', vscode.TreeItemCollapsibleState.None, pushIcon)
                ];
            }
            case 'Queue': {
                const q = s?.queueLength ?? 0;
                const qLabel = q === 0 ? '0 pending jobs' : `${q} job${q > 1 ? 's' : ''} waiting...`;
                return [
                    new TreeItems_1.StatusBarTreeItem(qLabel, 'queue', vscode.TreeItemCollapsibleState.None, 'clock', q > 0 ? 'Retry queue — jobs will push when network is available' : undefined)
                ];
            }
            case 'Actions': {
                const isRunning = !!s && s.status !== 'stopped';
                const isPaused = s?.status === 'paused';
                return [
                    isRunning
                        ? new TreeItems_1.ActionItem('Stop Autopilot', 'actionStop', 'autopilot.stop', 'debug-stop', 'Stop the autopilot watcher')
                        : new TreeItems_1.ActionItem('Start Autopilot', 'actionStart', 'autopilot.start', 'play', 'Start the autopilot watcher'),
                    isPaused
                        ? new TreeItems_1.ActionItem('Resume', 'actionResume', 'autopilot.resume', 'debug-start', 'Resume watching')
                        : new TreeItems_1.ActionItem('Pause', 'actionPause', 'autopilot.pause', 'debug-pause', 'Pause watching temporarily'),
                    new TreeItems_1.ActionItem('Undo Last Commit', 'actionUndo', 'autopilot.undo', 'discard', 'Revert the most recent autopilot commit'),
                    new TreeItems_1.ActionItem('Open Settings', 'actionSettings', 'autopilot.openSettings', 'settings-gear', 'Configure autopilot'),
                    new TreeItems_1.ActionItem('Run Doctor', 'actionDoctor', 'autopilot.runDoctor', 'pulse', 'Diagnose autopilot health'),
                    new TreeItems_1.ActionItem('Open Log', 'actionLog', 'autopilot.openLog', 'output', 'View live autopilot log'),
                ];
            }
            default:
                return [];
        }
    }
    statusLabel(status) {
        const map = {
            watching: '$(eye) Watching',
            paused: '$(debug-pause) Paused',
            conflict: '$(warning) Conflict detected!',
            committing: '$(git-commit) Committing...',
            pushing: '$(cloud-upload) Pushing...',
            stopped: '$(circle-slash) Stopped'
        };
        return map[status] ?? status;
    }
}
exports.AutopilotProvider = AutopilotProvider;
//# sourceMappingURL=AutopilotProvider.js.map
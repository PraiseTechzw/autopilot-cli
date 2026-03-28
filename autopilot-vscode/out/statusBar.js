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
exports.StatusBarItem = void 0;
const vscode = __importStar(require("vscode"));
const TreeItems_1 = require("./sidebar/TreeItems");
class StatusBarItem {
    constructor(context) {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.item.command = 'autopilot._statusBarClicked';
        context.subscriptions.push(this.item);
        // Register the click handler
        context.subscriptions.push(vscode.commands.registerCommand('autopilot._statusBarClicked', () => {
            this.onClick();
        }));
    }
    show() {
        this.update(undefined);
        this.item.show();
    }
    update(state) {
        if (!state) {
            this.item.text = '$(circle-slash) Autopilot: off';
            this.item.tooltip = 'Autopilot is not running. Click to start.';
            this.item.backgroundColor = undefined;
            this.item.color = new vscode.ThemeColor('descriptionForeground');
            return;
        }
        this.item.color = undefined;
        switch (state.status) {
            case 'watching':
                this.item.text = '$(eye) Autopilot';
                this.item.backgroundColor = undefined;
                break;
            case 'paused':
                this.item.text = '$(debug-pause) Autopilot: paused';
                this.item.backgroundColor = undefined;
                break;
            case 'conflict':
                this.item.text = '$(warning) Autopilot: conflict!';
                this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            case 'committing':
                this.item.text = '$(sync~spin) Autopilot: committing';
                this.item.backgroundColor = undefined;
                break;
            case 'pushing':
                this.item.text = state.queueLength > 0
                    ? `$(clock) Autopilot: queued (${state.queueLength})`
                    : '$(cloud-upload) Autopilot: pushing';
                this.item.backgroundColor = undefined;
                break;
            default:
                this.item.text = '$(circle-slash) Autopilot: off';
                this.item.backgroundColor = undefined;
        }
        // Build rich tooltip
        const lines = [
            `Status: ${state.status}`,
            `Branch: ${state.branch}${state.isProtected ? ' 🔒' : ''}`,
            `Uptime: ${(0, TreeItems_1.formatUptime)(state.uptime)}`,
        ];
        if (state.lastCommit) {
            lines.push(`Last commit: ${state.lastCommit.message}`);
        }
        if (state.lastPush) {
            lines.push(`Last push: ${state.lastPush.success ? 'succeeded' : 'failed'}`);
        }
        if (state.queueLength > 0) {
            lines.push(`Queue: ${state.queueLength} job(s) pending`);
        }
        this.item.tooltip = lines.join('\n');
    }
    async onClick() {
        const currentState = this.item.text;
        const isRunning = !currentState.includes('off');
        if (!isRunning) {
            const choice = await vscode.window.showQuickPick(['Start Autopilot', 'Open settings', 'Run doctor'], { placeHolder: 'Autopilot is not running' });
            if (choice === 'Start Autopilot') {
                vscode.commands.executeCommand('autopilot.start');
            }
            if (choice === 'Open settings') {
                vscode.commands.executeCommand('autopilot.openSettings');
            }
            if (choice === 'Run doctor') {
                vscode.commands.executeCommand('autopilot.runDoctor');
            }
        }
        else {
            const choice = await vscode.window.showQuickPick(['Pause', 'Undo last commit', 'Open log', 'Stop'], { placeHolder: 'Autopilot is running' });
            if (choice === 'Pause') {
                vscode.commands.executeCommand('autopilot.pause');
            }
            if (choice === 'Undo last commit') {
                vscode.commands.executeCommand('autopilot.undo');
            }
            if (choice === 'Open log') {
                vscode.commands.executeCommand('autopilot.openLog');
            }
            if (choice === 'Stop') {
                vscode.commands.executeCommand('autopilot.stop');
            }
        }
    }
}
exports.StatusBarItem = StatusBarItem;
//# sourceMappingURL=statusBar.js.map
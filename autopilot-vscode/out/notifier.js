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
exports.Notifier = void 0;
const vscode = __importStar(require("vscode"));
class Notifier {
    constructor(context, cliRunner) {
        this.context = context;
        this.cliRunner = cliRunner;
    }
    onPushSucceeded(state) {
        if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) {
            return;
        }
        const msg = state.lastCommit?.message ?? 'commit';
        vscode.window.showInformationMessage(`Autopilot pushed: "${msg}"`, 'View log').then(action => {
            if (action === 'View log') {
                vscode.commands.executeCommand('autopilot.openLog');
            }
        });
    }
    onPushFailed(_state) {
        if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) {
            return;
        }
        vscode.window.showWarningMessage('Autopilot: push failed — added to retry queue', 'View queue', 'Open log').then(action => {
            if (action === 'Open log') {
                vscode.commands.executeCommand('autopilot.openLog');
            }
        });
    }
    onConflictDetected(state) {
        if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) {
            return;
        }
        vscode.window.showErrorMessage(`Autopilot paused: merge conflict detected on ${state.branch}. Resolve manually.`, 'Open terminal', 'View log').then(action => {
            if (action === 'Open terminal') {
                vscode.commands.executeCommand('workbench.action.terminal.new');
            }
            else if (action === 'View log') {
                vscode.commands.executeCommand('autopilot.openLog');
            }
        });
    }
    onProcessExited() {
        if (!vscode.workspace.getConfiguration('autopilot').get('showNotifications', true)) {
            return;
        }
        vscode.window.showWarningMessage('Autopilot stopped unexpectedly.', 'Restart', 'Dismiss').then(action => {
            if (action === 'Restart') {
                this.cliRunner.start();
            }
        });
    }
}
exports.Notifier = Notifier;
//# sourceMappingURL=notifier.js.map
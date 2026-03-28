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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const stateReader_1 = require("./stateReader");
const cliRunner_1 = require("./cliRunner");
const statusBar_1 = require("./statusBar");
const AutopilotProvider_1 = require("./sidebar/AutopilotProvider");
const SettingsPanel_1 = require("./webview/SettingsPanel");
const LogPanel_1 = require("./webview/LogPanel");
const notifier_1 = require("./notifier");
let stateReader;
let cliRunner;
let statusBar;
let provider;
let notifier;
function activate(context) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        return;
    }
    // Check for .autopilotrc.json
    const rcPath = path.join(workspaceRoot, '.autopilotrc.json');
    const hasConfig = fs.existsSync(rcPath);
    if (!hasConfig) {
        vscode.window.showInformationMessage('No .autopilotrc.json found. Run autopilot init in your terminal to get started.', 'Open Terminal').then(action => {
            if (action === 'Open Terminal') {
                vscode.commands.executeCommand('workbench.action.terminal.new');
            }
        });
    }
    // Instantiate core modules
    cliRunner = new cliRunner_1.CliRunner(workspaceRoot, context);
    stateReader = new stateReader_1.StateReader(workspaceRoot, context);
    statusBar = new statusBar_1.StatusBarItem(context);
    provider = new AutopilotProvider_1.AutopilotProvider(context);
    notifier = new notifier_1.Notifier(context, cliRunner);
    // Register sidebar tree view
    const treeView = vscode.window.createTreeView('autopilotSidebar', {
        treeDataProvider: provider,
        showCollapseAll: false
    });
    context.subscriptions.push(treeView);
    // Show status bar
    statusBar.show();
    // Wire up state changes
    stateReader.on('stateChange', (state) => {
        statusBar.update(state);
        provider.refresh(state);
    });
    stateReader.on('conflictDetected', (state) => {
        notifier.onConflictDetected(state);
    });
    stateReader.on('pushSucceeded', (state) => {
        notifier.onPushSucceeded(state);
    });
    stateReader.on('pushFailed', (state) => {
        notifier.onPushFailed(state);
    });
    stateReader.on('processExited', () => {
        notifier.onProcessExited();
    });
    // Start polling
    stateReader.start();
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('autopilot.start', async () => {
        await cliRunner.start();
    }), vscode.commands.registerCommand('autopilot.stop', async () => {
        const confirm = await vscode.window.showWarningMessage('Stop Autopilot?', { modal: true }, 'Stop');
        if (confirm === 'Stop') {
            await cliRunner.stop();
        }
    }), vscode.commands.registerCommand('autopilot.pause', async () => {
        await cliRunner.pause();
        vscode.window.showInformationMessage('Autopilot paused.');
    }), vscode.commands.registerCommand('autopilot.resume', async () => {
        await cliRunner.resume();
        vscode.window.showInformationMessage('Autopilot resumed.');
    }), vscode.commands.registerCommand('autopilot.undo', async () => {
        const confirm = await vscode.window.showWarningMessage('Undo the last autopilot commit? This cannot be undone.', { modal: true }, 'Undo');
        if (confirm === 'Undo') {
            const result = await cliRunner.undo();
            if (result.success) {
                vscode.window.showInformationMessage(`Undone: ${result.message}`);
            }
            else {
                vscode.window.showErrorMessage(`Undo failed: ${result.message}`);
            }
        }
    }), vscode.commands.registerCommand('autopilot.openSettings', () => {
        SettingsPanel_1.SettingsPanel.createOrShow(context, workspaceRoot, cliRunner);
    }), vscode.commands.registerCommand('autopilot.openLog', () => {
        LogPanel_1.LogPanel.createOrShow(context, workspaceRoot);
    }), vscode.commands.registerCommand('autopilot.runDoctor', async () => {
        const output = await cliRunner.runDoctor();
        const channel = vscode.window.createOutputChannel('Autopilot Doctor');
        channel.clear();
        channel.appendLine(output);
        channel.show();
    }), vscode.commands.registerCommand('autopilot.showStatus', async () => {
        const output = await cliRunner.getStatus();
        const channel = vscode.window.createOutputChannel('Autopilot Status');
        channel.clear();
        channel.appendLine(output);
        channel.show();
    }), vscode.commands.registerCommand('autopilot.init', async () => {
        await cliRunner.run('init', []);
        SettingsPanel_1.SettingsPanel.createOrShow(context, workspaceRoot, cliRunner);
    }));
    // Ask to start if config exists but process isn't running
    if (hasConfig) {
        setTimeout(async () => {
            const state = stateReader.getLastState();
            if (!state || state.status === 'stopped') {
                const action = await vscode.window.showInformationMessage('Autopilot is not running. Start it now?', 'Start', 'Not now');
                if (action === 'Start') {
                    await cliRunner.start();
                }
            }
        }, 2000);
    }
}
function deactivate() {
    stateReader?.stop();
    // Do NOT kill the CLI process — it keeps running after VS Code closes
}
//# sourceMappingURL=extension.js.map
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
exports.LogPanel = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LogPanel {
    static createOrShow(context, workspaceRoot) {
        if (LogPanel.currentPanel) {
            LogPanel.currentPanel.panel.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel('autopilotLog', 'Autopilot Log', vscode.ViewColumn.Two, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        });
        LogPanel.currentPanel = new LogPanel(panel, context, workspaceRoot);
    }
    constructor(panel, context, workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.disposables = [];
        this.lastSize = 0;
        this.panel = panel;
        this.logPath = path.join(workspaceRoot, '.autopilot.log');
        const htmlPath = path.join(context.extensionPath, 'media', 'log.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');
        panel.webview.onDidReceiveMessage((msg) => {
            if (msg.command === 'ready') {
                this.sendInitialLog();
                this.startPolling();
            }
            if (msg.command === 'copyAll') {
                vscode.env.clipboard.writeText(msg.text);
                vscode.window.showInformationMessage('Log copied to clipboard.');
            }
        }, undefined, this.disposables);
        panel.onDidDispose(() => {
            LogPanel.currentPanel = undefined;
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
            }
            this.disposables.forEach(d => d.dispose());
        });
    }
    sendInitialLog() {
        if (!fs.existsSync(this.logPath)) {
            this.panel.webview.postMessage({ command: 'updateStatus', status: 'No log file found yet.' });
            return;
        }
        const content = fs.readFileSync(this.logPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        this.lastSize = Buffer.byteLength(content, 'utf-8');
        if (lines.length > 0) {
            this.panel.webview.postMessage({ command: 'appendLines', lines });
        }
        this.updateStatusBar();
    }
    startPolling() {
        this.pollTimer = setInterval(() => this.pollLog(), 1000);
    }
    pollLog() {
        if (!fs.existsSync(this.logPath)) {
            return;
        }
        try {
            const stat = fs.statSync(this.logPath);
            if (stat.size <= this.lastSize) {
                return;
            }
            const fd = fs.openSync(this.logPath, 'r');
            const newBytes = stat.size - this.lastSize;
            const buf = Buffer.alloc(newBytes);
            fs.readSync(fd, buf, 0, newBytes, this.lastSize);
            fs.closeSync(fd);
            this.lastSize = stat.size;
            const newText = buf.toString('utf-8');
            const lines = newText.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                this.panel.webview.postMessage({ command: 'appendLines', lines });
            }
            this.updateStatusBar();
        }
        catch {
            // race condition — ignore
        }
    }
    updateStatusBar() {
        const statePath = path.join(this.workspaceRoot, '.autopilot-state.json');
        try {
            const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
            this.panel.webview.postMessage({
                command: 'updateStatus',
                status: `Status: ${state.status} | Branch: ${state.branch} | Queue: ${state.queueLength}`
            });
        }
        catch {
            this.panel.webview.postMessage({
                command: 'updateStatus',
                status: 'Autopilot not running'
            });
        }
    }
}
exports.LogPanel = LogPanel;
//# sourceMappingURL=LogPanel.js.map
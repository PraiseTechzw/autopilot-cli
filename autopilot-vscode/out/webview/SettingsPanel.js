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
exports.SettingsPanel = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SettingsPanel {
    static createOrShow(context, workspaceRoot, cli) {
        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel.panel.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel('autopilotSettings', 'Autopilot Settings', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] });
        SettingsPanel.currentPanel = new SettingsPanel(panel, context, workspaceRoot, cli);
    }
    constructor(panel, context, workspaceRoot, cli) {
        this.workspaceRoot = workspaceRoot;
        this.cli = cli;
        this.disposables = [];
        this.panel = panel;
        const htmlPath = path.join(context.extensionPath, 'media', 'settings.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');
        panel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'ready':
                    this.sendConfig();
                    break;
                case 'save':
                    await this.saveConfig(msg.config);
                    break;
                case 'pickFolder': {
                    const result = await vscode.window.showOpenDialog({
                        canSelectFolders: true, canSelectFiles: false, canSelectMany: false
                    });
                    if (result?.[0]) {
                        panel.webview.postMessage({
                            command: 'loadConfig',
                            config: { ...(await this.readConfig()), watchPath: result[0].fsPath }
                        });
                    }
                    break;
                }
            }
        }, undefined, this.disposables);
        panel.onDidDispose(() => {
            SettingsPanel.currentPanel = undefined;
            this.disposables.forEach(d => d.dispose());
        });
    }
    async readConfig() {
        const rcPath = path.join(this.workspaceRoot, '.autopilotrc.json');
        try {
            return JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
        }
        catch {
            return {};
        }
    }
    async sendConfig() {
        const config = await this.readConfig();
        config.watchPath = this.workspaceRoot;
        this.panel.webview.postMessage({ command: 'loadConfig', config });
    }
    async saveConfig(incoming) {
        const rcPath = path.join(this.workspaceRoot, '.autopilotrc.json');
        try {
            const existing = await this.readConfig();
            const merged = { ...existing, ...incoming };
            fs.writeFileSync(rcPath, JSON.stringify(merged, null, 2));
            this.panel.webview.postMessage({ command: 'saveSuccess' });
            const action = await vscode.window.showInformationMessage('Settings saved. Restart autopilot to apply changes.', 'Restart now');
            if (action === 'Restart now') {
                await this.cli.stop();
                setTimeout(() => this.cli.start(), 1500);
            }
        }
        catch (err) {
            this.panel.webview.postMessage({ command: 'saveError', error: err.message });
        }
    }
}
exports.SettingsPanel = SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map
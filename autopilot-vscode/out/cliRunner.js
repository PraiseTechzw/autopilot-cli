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
exports.CliRunner = void 0;
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class CliRunner {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
    }
    getCli() {
        return vscode.workspace
            .getConfiguration('autopilot')
            .get('cliPath', 'autopilot');
    }
    /** Generic command runner, returns stdout */
    async run(command, args = [], timeout = 30000) {
        return new Promise((resolve, reject) => {
            const cli = this.getCli();
            const child = cp.spawn(cli, [command, ...args], {
                cwd: this.workspaceRoot,
                shell: false,
                timeout
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (d) => { stdout += d.toString(); });
            child.stderr?.on('data', (d) => { stderr += d.toString(); });
            child.on('error', (err) => {
                if (err.code === 'ENOENT') {
                    vscode.window.showErrorMessage('Autopilot CLI not found. Install it with: npm install -g autopilot-cli', 'Copy install command').then(action => {
                        if (action === 'Copy install command') {
                            vscode.env.clipboard.writeText('npm install -g autopilot-cli');
                        }
                    });
                }
                reject(err);
            });
            child.on('close', (code) => {
                if (code !== 0 && !stdout) {
                    reject(new Error(stderr || `Exit code ${code}`));
                }
                else {
                    resolve(stdout || stderr);
                }
            });
        });
    }
    /** Start autopilot detached (doesn't die when VS Code closes) */
    async start() {
        try {
            const cli = this.getCli();
            const child = cp.spawn(cli, ['start'], {
                cwd: this.workspaceRoot,
                detached: true,
                stdio: 'ignore',
                shell: false
            });
            child.unref();
            // Wait up to 3 seconds for state file to appear
            const statePath = path.join(this.workspaceRoot, '.autopilot-state.json');
            let waited = 0;
            await new Promise(resolve => {
                const check = setInterval(() => {
                    waited += 500;
                    if (fs.existsSync(statePath) || waited >= 3000) {
                        clearInterval(check);
                        resolve();
                    }
                }, 500);
            });
            if (!fs.existsSync(statePath)) {
                vscode.window.showWarningMessage('Autopilot may not have started — no state file detected after 3s.');
            }
            else {
                vscode.window.showInformationMessage('Autopilot started.');
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to start autopilot: ${err.message}`);
        }
    }
    async stop() {
        try {
            const statePath = path.join(this.workspaceRoot, '.autopilot-state.json');
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                if (state.pid) {
                    try {
                        process.kill(state.pid, 'SIGTERM');
                    }
                    catch { /* already dead */ }
                }
            }
            await this.run('stop', []).catch(() => { });
            vscode.window.showInformationMessage('Autopilot stopped.');
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to stop autopilot: ${err.message}`);
        }
    }
    async undo() {
        try {
            const output = await this.run('undo', []);
            return { success: true, message: output.trim() };
        }
        catch (err) {
            return { success: false, message: err.message };
        }
    }
    async pause() {
        const pausePath = path.join(this.workspaceRoot, '.autopilot-pause');
        fs.writeFileSync(pausePath, '');
        await this.run('pause', []).catch(() => { });
    }
    async resume() {
        const pausePath = path.join(this.workspaceRoot, '.autopilot-pause');
        if (fs.existsSync(pausePath)) {
            fs.unlinkSync(pausePath);
        }
        await this.run('resume', []).catch(() => { });
    }
    async runDoctor() {
        try {
            return await this.run('doctor', [], 60000);
        }
        catch (err) {
            return `Doctor failed: ${err.message}`;
        }
    }
    async getStatus() {
        try {
            return await this.run('status', []);
        }
        catch (err) {
            return `Status failed: ${err.message}`;
        }
    }
}
exports.CliRunner = CliRunner;
//# sourceMappingURL=cliRunner.js.map
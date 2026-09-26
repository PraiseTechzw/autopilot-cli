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
exports.AutopilotCli = exports.AutopilotCliError = void 0;
const node_child_process_1 = require("node:child_process");
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const protocol_1 = require("./protocol");
class AutopilotCliError extends Error {
    kind;
    exitCode;
    constructor(message, kind = 'command', exitCode) {
        super(message);
        this.kind = kind;
        this.exitCode = exitCode;
        this.name = 'AutopilotCliError';
    }
}
exports.AutopilotCliError = AutopilotCliError;
class AutopilotCli {
    output;
    constructor(output = vscode.window.createOutputChannel('Autopilot')) {
        this.output = output;
    }
    get command() {
        return vscode.workspace.getConfiguration('autopilot').get('command', 'autopilot');
    }
    get cwd() {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    }
    async run(args, options = {}) {
        const finalArgs = (0, protocol_1.buildCliArgs)(args, options.json, options.ai);
        this.output.appendLine(`$ ${this.command} ${finalArgs.join(' ')}`);
        return new Promise((resolve, reject) => {
            const child = (0, node_child_process_1.spawn)(this.command, finalArgs, { cwd: this.cwd, shell: false, windowsHide: true });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
            child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
            child.on('error', (error) => {
                const kind = error.code === 'ENOENT' ? 'not-found' : 'command';
                reject(new AutopilotCliError(`Autopilot CLI unavailable: ${this.command}`, kind));
            });
            child.on('close', (code) => {
                this.output.appendLine(stdout.trim() || stderr.trim());
                if (code !== 0) {
                    const text = (stderr || stdout).trim() || `Autopilot exited with code ${code}`;
                    reject(new AutopilotCliError(text, (0, protocol_1.classifyError)(text), code ?? undefined));
                    return;
                }
                if (!options.json) {
                    resolve(stdout.trim());
                    return;
                }
                try {
                    resolve((0, protocol_1.parseJson)(stdout, args.join(' ')));
                }
                catch (error) {
                    reject(new AutopilotCliError(error instanceof Error ? error.message : String(error)));
                }
            });
        });
    }
    async version() {
        return this.run(['version']);
    }
    async assertCompatible() {
        const actual = await this.version();
        const minimum = vscode.workspace.getConfiguration('autopilot').get('minimumVersion', '1.0.0');
        if (!(0, protocol_1.versionAtLeast)(actual, minimum)) {
            throw new AutopilotCliError(`Autopilot ${minimum}+ is required; found ${actual}`, 'version');
        }
    }
    workspacePath() { return path.resolve(this.cwd); }
}
exports.AutopilotCli = AutopilotCli;
//# sourceMappingURL=cli.js.map
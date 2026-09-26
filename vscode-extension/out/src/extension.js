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
const cli_1 = require("./cli");
const dashboard_1 = require("./dashboard");
function activate(context) {
    const cli = new cli_1.AutopilotCli();
    const dashboard = new dashboard_1.AutopilotDashboard(cli);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('autopilot.dashboard', dashboard));
    context.subscriptions.push(vscode.commands.registerCommand('autopilot.refresh', () => dashboard.refresh()), vscode.commands.registerCommand('autopilot.verify', () => dashboard.dispatch('verify')), vscode.commands.registerCommand('autopilot.review', () => dashboard.dispatch('review')), vscode.commands.registerCommand('autopilot.resume', () => dashboard.dispatch('resume')), vscode.commands.registerCommand('autopilot.executeTask', () => dashboard.dispatch('execute')), vscode.commands.registerCommand('autopilot.checkpoint', () => dashboard.dispatch('checkpoint')), vscode.commands.registerCommand('autopilot.restore', () => dashboard.dispatch('restore')), vscode.commands.registerCommand('autopilot.history', () => dashboard.dispatch('history')), vscode.commands.registerCommand('autopilot.configure', () => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:praisetechzw.autopilot-dev')), vscode.commands.registerCommand('autopilot.proposeFix', () => dashboard.dispatch('proposeFix')), vscode.commands.registerCommand('autopilot.ciStatus', () => dashboard.dispatch('ciStatus')));
    void cli.assertCompatible().catch(error => {
        const message = error instanceof cli_1.AutopilotCliError ? error.message : String(error);
        void vscode.window.showWarningMessage(message, 'Open Settings').then(choice => { if (choice === 'Open Settings')
            void vscode.commands.executeCommand('workbench.action.openSettings', '@ext:praisetechzw.autopilot-dev'); });
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
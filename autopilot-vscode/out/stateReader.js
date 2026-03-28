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
exports.StateReader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const vscode = __importStar(require("vscode"));
class StateReader extends events_1.EventEmitter {
    constructor(workspaceRoot, context) {
        super();
        this.lastConflict = false;
        this.lastQueueLength = 0;
        this.workspaceRoot = workspaceRoot;
        this.statePath = path.join(workspaceRoot, '.autopilot-state.json');
        this.pollInterval = vscode.workspace
            .getConfiguration('autopilot')
            .get('pollInterval', 2000);
    }
    start() {
        this.poll();
        this.timer = setInterval(() => this.poll(), this.pollInterval);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
    getLastState() {
        return this.lastState;
    }
    poll() {
        try {
            if (!fs.existsSync(this.statePath)) {
                if (this.lastState) {
                    // State file disappeared — process stopped
                    this.lastState = undefined;
                    this.emit('processExited');
                    this.emit('stateChange', undefined);
                }
                return;
            }
            const raw = fs.readFileSync(this.statePath, 'utf-8');
            const state = JSON.parse(raw);
            // Check if PID is alive
            try {
                process.kill(state.pid, 0);
            }
            catch {
                this.emit('processExited');
                this.lastState = undefined;
                return;
            }
            // Detect specific events
            if (state.conflicts && !this.lastConflict) {
                this.emit('conflictDetected', state);
            }
            this.lastConflict = state.conflicts;
            if (state.lastPush) {
                if (this.lastPushSuccess === undefined) {
                    this.lastPushSuccess = state.lastPush.success;
                }
                else if (state.lastPush.success !== this.lastPushSuccess) {
                    if (state.lastPush.success) {
                        this.emit('pushSucceeded', state);
                    }
                    else {
                        this.emit('pushFailed', state);
                    }
                    this.lastPushSuccess = state.lastPush.success;
                }
            }
            if (state.queueLength !== this.lastQueueLength) {
                this.emit('queueChanged', state);
                this.lastQueueLength = state.queueLength;
            }
            // Only emit stateChange if something meaningful changed
            if (!this.lastState || !this.statesEqual(this.lastState, state)) {
                this.lastState = state;
                this.emit('stateChange', state);
            }
        }
        catch {
            // Silent fail — malformed JSON or race condition
        }
    }
    statesEqual(a, b) {
        return (a.status === b.status &&
            a.branch === b.branch &&
            a.queueLength === b.queueLength &&
            a.conflicts === b.conflicts &&
            a.uptime === b.uptime &&
            a.lastCommit?.hash === b.lastCommit?.hash &&
            a.lastPush?.success === b.lastPush?.success);
    }
}
exports.StateReader = StateReader;
//# sourceMappingURL=stateReader.js.map
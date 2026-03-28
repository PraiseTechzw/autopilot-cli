import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';

export interface AutopilotState {
  pid: number;
  startedAt: string;
  branch: string;
  isProtected: boolean;
  status: 'watching' | 'paused' | 'stopped' | 'conflict' | 'committing' | 'pushing';
  lastCommit: { hash: string; message: string; timestamp: string } | null;
  lastPush: { hash: string | null; success: boolean; timestamp: string } | null;
  queueLength: number;
  conflicts: boolean;
  watchPath: string;
  uptime: number;
}

export class StateReader extends EventEmitter {
  private workspaceRoot: string;
  private statePath: string;
  private pollInterval: number;
  private timer: NodeJS.Timeout | undefined;
  private lastState: AutopilotState | undefined;
  private lastConflict = false;
  private lastPushSuccess: boolean | undefined;
  private lastQueueLength = 0;

  constructor(workspaceRoot: string, context: vscode.ExtensionContext) {
    super();
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

  getLastState(): AutopilotState | undefined {
    return this.lastState;
  }

  private poll() {
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
      const state: AutopilotState = JSON.parse(raw);

      // Check if PID is alive
      try {
        process.kill(state.pid, 0);
      } catch {
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
        } else if (state.lastPush.success !== this.lastPushSuccess) {
          if (state.lastPush.success) {
            this.emit('pushSucceeded', state);
          } else {
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

    } catch {
      // Silent fail — malformed JSON or race condition
    }
  }

  private statesEqual(a: AutopilotState, b: AutopilotState): boolean {
    return (
      a.status === b.status &&
      a.branch === b.branch &&
      a.queueLength === b.queueLength &&
      a.conflicts === b.conflicts &&
      a.uptime === b.uptime &&
      a.lastCommit?.hash === b.lastCommit?.hash &&
      a.lastPush?.success === b.lastPush?.success
    );
  }
}

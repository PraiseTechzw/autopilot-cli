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
exports.GroupItem = exports.ActionItem = exports.StatusBarTreeItem = void 0;
exports.formatUptime = formatUptime;
exports.timeAgo = timeAgo;
exports.statusIcon = statusIcon;
const vscode = __importStar(require("vscode"));
class StatusBarTreeItem extends vscode.TreeItem {
    constructor(label, contextValue, collapsible = vscode.TreeItemCollapsibleState.None, iconId, tooltip, color) {
        super(label, collapsible);
        this.contextValue = contextValue;
        this.contextValue = contextValue;
        if (iconId) {
            this.iconPath = color
                ? new vscode.ThemeIcon(iconId, color)
                : new vscode.ThemeIcon(iconId);
        }
        if (tooltip) {
            this.tooltip = tooltip;
        }
    }
}
exports.StatusBarTreeItem = StatusBarTreeItem;
class ActionItem extends vscode.TreeItem {
    constructor(label, contextValue, commandId, iconId, tooltip) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = contextValue;
        this.contextValue = contextValue;
        this.command = { command: commandId, title: label };
        this.iconPath = new vscode.ThemeIcon(iconId);
        if (tooltip) {
            this.tooltip = tooltip;
        }
    }
}
exports.ActionItem = ActionItem;
class GroupItem extends vscode.TreeItem {
    constructor(label, iconId) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.contextValue = 'group';
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
    }
}
exports.GroupItem = GroupItem;
function formatUptime(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const m = Math.floor(seconds / 60) % 60;
    const h = Math.floor(seconds / 3600);
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
}
function timeAgo(isoString) {
    if (!isoString) {
        return 'never';
    }
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) {
        return `${diff}s ago`;
    }
    if (diff < 3600) {
        return `${Math.floor(diff / 60)}m ago`;
    }
    return `${Math.floor(diff / 3600)}h ago`;
}
function statusIcon(state) {
    if (!state) {
        return { id: 'circle-slash' };
    }
    switch (state.status) {
        case 'watching': return { id: 'eye' };
        case 'paused': return { id: 'debug-pause' };
        case 'conflict': return { id: 'warning', color: new vscode.ThemeColor('list.warningForeground') };
        case 'committing': return { id: 'git-commit' };
        case 'pushing': return { id: 'cloud-upload' };
        default: return { id: 'circle-slash' };
    }
}
//# sourceMappingURL=TreeItems.js.map
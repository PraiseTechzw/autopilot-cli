"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const protocol_1 = require("../src/protocol");
(0, node_test_1.default)('builds safe structured CLI arguments without shell interpolation', () => {
    strict_1.default.deepEqual((0, protocol_1.buildCliArgs)(['review', '--staged'], true, true), ['review', '--staged', '--json', '--ai']);
    strict_1.default.deepEqual((0, protocol_1.buildCliArgs)(['execute-task', 'fix login; echo unsafe'], false, false), ['execute-task', 'fix login; echo unsafe']);
});
(0, node_test_1.default)('parses structured JSON and reports malformed responses', () => {
    strict_1.default.deepEqual((0, protocol_1.parseJson)('{"passed":true}', 'verify'), { passed: true });
    strict_1.default.throws(() => (0, protocol_1.parseJson)('{broken', 'verify'), /invalid JSON/);
});
(0, node_test_1.default)('checks CLI compatibility across patch and major versions', () => {
    strict_1.default.equal((0, protocol_1.versionAtLeast)('1.0.0', '1.0.0'), true);
    strict_1.default.equal((0, protocol_1.versionAtLeast)('1.0.3', '1.0.0'), true);
    strict_1.default.equal((0, protocol_1.versionAtLeast)('0.9.9', '1.0.0'), false);
    strict_1.default.equal((0, protocol_1.versionAtLeast)('2.0.0', '1.0.0'), true);
});
(0, node_test_1.default)('maps common CLI failures to actionable categories', () => {
    strict_1.default.equal((0, protocol_1.classifyError)('set GITHUB_TOKEN before using GitHub commands'), 'auth');
    strict_1.default.equal((0, protocol_1.classifyError)('AI provider unavailable: OPENROUTER_API_KEY'), 'provider');
    strict_1.default.equal((0, protocol_1.classifyError)('not a Git repository'), 'git');
    strict_1.default.equal((0, protocol_1.classifyError)('unexpected failure'), 'command');
});
//# sourceMappingURL=protocol.test.js.map
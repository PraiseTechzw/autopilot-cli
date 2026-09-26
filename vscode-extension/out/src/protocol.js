"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCliArgs = buildCliArgs;
exports.parseJson = parseJson;
exports.versionAtLeast = versionAtLeast;
exports.classifyError = classifyError;
function buildCliArgs(args, json = false, ai = false) {
    return [...args, ...(json ? ['--json'] : []), ...(ai ? ['--ai'] : [])];
}
function parseJson(stdout, command) {
    try {
        return JSON.parse(stdout);
    }
    catch {
        throw new Error(`Autopilot returned invalid JSON for: ${command}`);
    }
}
function versionAtLeast(actual, minimum) {
    const parse = (value) => value.trim().replace(/^v/, '').split('.').map(Number);
    const a = parse(actual);
    const m = parse(minimum);
    return !a.some(Number.isNaN) && !m.some(Number.isNaN) && (a[0] > m[0] || (a[0] === m[0] && (a[1] > m[1] || (a[1] === m[1] && a[2] >= m[2]))));
}
function classifyError(text) {
    if (/GITHUB_TOKEN|GH_TOKEN|authentication|unauthorized/i.test(text))
        return 'auth';
    if (/provider|OPENROUTER|AI_API_KEY/i.test(text))
        return 'provider';
    if (/git|repository|working tree/i.test(text))
        return 'git';
    return 'command';
}
//# sourceMappingURL=protocol.js.map
export interface Status { repository: string; branch: string; clean: boolean; changes: string[]; }
export interface Verification { passed: boolean; checks: Array<{ name: string; passed: boolean; required: boolean; detail: string }>; }
export interface Review { findings: Array<{ severity: string; title: string; explanation: string; suggestion: string }>; high_risk: boolean; }
export interface ResumeContext { branch: string; head_sha: string; clean: boolean; changes: string[]; languages: string[]; frameworks: string[]; memory: unknown[]; workflow: Record<string, unknown> | null; }
export interface Analysis { languages?: string[]; frameworks?: string[]; architecture?: string[]; dependencies?: string[]; }
export interface CiStatus { runs: Array<{ name: string; status: string; conclusion?: string; branch: string; url: string }>; }
export interface AuditEvent { timestamp: string; event: string; [key: string]: unknown; }

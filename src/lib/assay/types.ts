export type Dimension = 'security' | 'correctness' | 'architecture' | 'quality';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  dimension: Dimension;
  title: string;
  severity: Severity;
  file?: string;
  evidence: string;
  recommendation: string;
}

export type SubmissionStatus = 'pending' | 'running' | 'sent' | 'failed' | 'queued' | 'manual';

export interface Submission {
  id: string;
  kind: 'assay' | 'contact';
  email: string;
  link: string;
  name: string;
  message: string;
  status: SubmissionStatus;
  createdAt: string;
}

export interface AuditSummary {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export interface SecretHit {
  path: string;
  kind: string;
  line: number;
}

export interface RepoFile {
  path: string;
  content: string;
}

export interface RepoContext {
  repoUrl: string;
  fileList: string[];
  files: RepoFile[];
  audit: AuditSummary;
  secretHits: SecretHit[];
}

export interface ReviewResult {
  dimension: Dimension;
  ok: boolean;
  findings: Finding[];
}

export interface SubmissionStore {
  insert(sub: Pick<Submission, 'kind' | 'email' | 'link' | 'name' | 'message' | 'status'>): Promise<string>;
  get(id: string): Promise<Submission | null>;
  setStatus(id: string, status: SubmissionStatus, detail?: string): Promise<void>;
  saveReport(id: string, html: string, findings: Finding[]): Promise<void>;
  countToday(): Promise<number>;
  countTodayByEmail(email: string): Promise<number>;
}

export type GenerateFn = <T>(args: { schema: import('zod').ZodType<T>; prompt: string }) => Promise<T>;

export interface AssayDeps {
  store: SubmissionStore;
  sendEmail(msg: { to: string; subject: string; html: string }): Promise<void>;
  notifyFounder(subject: string, body: string): Promise<void>;
  generate: GenerateFn;
  collectRepo(repoUrl: string): Promise<RepoContext>;
  log(message: string, data?: unknown): void;
}

// API Types - matching backend models

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface FileSystemNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: FileSystemNode[];
}

export interface FileInfo {
  path: string;
  size: number;
}

export interface Repository {
  repoId: string;
  repoPath: string;
  files: FileInfo[];
  cached: boolean;
}

export interface Vulnerability {
  line: number;
  type: string;
  severity: string;
  code: string;
}

export interface Issue {
  line: number;
  type: string;
  severity: string;
  message: string;
  code: string;
  suggestion: string;
}

export interface AnalysisResult {
  file: string;
  score?: number;
  issues?: Issue[];
  strengths?: string[];
  summary?: string;
  vulnerabilities?: Vulnerability[];
  error?: string;
}

export interface AnalysisSummary {
  overallScore: number;
  totalFiles: number;
  vulnerabilityCount: number;
  reviewedAt: string;
}

export interface AnalysisResponse {
  results: AnalysisResult[];
  summary: AnalysisSummary;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface SavedRepository {
  id: string;
  name: string;
  url: string;
  branch: string;
  repoId: string | null;
  cloned: boolean;
  createdAt: string;
  lastUsed: string | null;
  updatedAt?: string;
}

export interface SavedReposResponse {
  repos: SavedRepository[];
}

// Request types
export interface CloneRequest {
  repoUrl: string;
  branch?: string;
}

export interface SyncRequest {
  repoUrl: string;
  branch?: string;
}

export interface AnalyzeRequest {
  repoId: string;
  model: string;
  files: FileInfo[];
}

export interface CreateSavedRepoRequest {
  url: string;
  branch?: string;
  name?: string;
  repoId?: string | null;
  cloned?: boolean;
}

// Pull Request types
export interface PullRequest {
  id: string;
  repoId: string;
  title: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  createdAt: Date | string;
  updatedAt: Date | string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  filesChanged: string[];
}

export interface Comment {
  id: string;
  prId: string;
  author: string;
  content: string;
  createdAt: Date | string;
  filePath?: string;
  line?: number;
  type: 'user' | 'ai';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface FileDiff {
  filePath: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface FileChange {
  filePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
}

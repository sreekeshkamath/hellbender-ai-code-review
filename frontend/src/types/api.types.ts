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
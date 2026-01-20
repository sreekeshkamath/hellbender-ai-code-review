/**
 * Review Session Types
 * 
 * This module defines TypeScript interfaces for the review session feature.
 * These types match the backend models for use in frontend components.
 */

/**
 * Persistent Repository interface
 */
export interface PersistentRepository {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  storagePath: string;
  createdAt: string;
  lastSyncedAt: string | null;
  isActive: boolean;
}

/**
 * Request payload for creating a persistent repository
 */
export interface CreatePersistentRepositoryRequest {
  url: string;
  name?: string;
  branch?: string;
}

/**
 * Review Session Status
 */
export type ReviewSessionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Review Session interface
 */
export interface ReviewSession {
  id: string;
  repositoryId: string;
  name: string;
  sourceBranch: string;
  targetBranch: string;
  modelId: string | null;
  status: ReviewSessionStatus;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
  files?: ReviewFile[];
}

/**
 * Request payload for creating a review session
 */
export interface CreateReviewSessionRequest {
  repositoryId: string;
  name?: string;
  sourceBranch: string;
  targetBranch: string;
  modelId?: string;
}

/**
 * Comment type enum
 */
export type CommentType = 'issue' | 'suggestion' | 'praise' | 'question' | 'todo';

/**
 * Severity level enum
 */
export type Severity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Diff line type
 */
export type DiffLineType = 'context' | 'added' | 'removed';

/**
 * Diff line interface
 */
export interface DiffLine {
  type: DiffLineType;
  lineNumber: number;
  content: string;
}

/**
 * Diff hunk interface
 */
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
  header: string;
}

/**
 * Review Comment interface
 */
export interface ReviewComment {
  id: string;
  reviewFileId: string;
  lineNumber: number;
  commentType: CommentType;
  severity: Severity;
  message: string;
  codeSnippet: string | null;
  suggestion: string | null;
  createdAt: string;
}

/**
 * Review File interface
 */
export interface ReviewFile {
  id: string;
  reviewSessionId: string;
  filePath: string;
  score: number | null;
  summary: string | null;
  diffHunks: DiffHunk[];
  analyzedAt: string;
  comments?: ReviewComment[];
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  count?: number;
}

/**
 * Branch information
 */
export interface BranchInfo {
  name: string;
  isDefault: boolean;
}

/**
 * File change information
 */
export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

/**
 * Review session summary for list view
 */
export interface ReviewSessionSummary {
  id: string;
  name: string;
  repositoryName: string;
  sourceBranch: string;
  targetBranch: string;
  status: ReviewSessionStatus;
  overallScore: number | null;
  fileCount: number;
  commentCount: number;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Diff display line for UI
 */
export interface DiffDisplayLine {
  lineNumber: number;
  type: DiffLineType;
  content: string;
  isHeader?: boolean;
  comments?: ReviewComment[];
}

/**
 * Review statistics
 */
export interface ReviewStatistics {
  totalFiles: number;
  totalComments: number;
  commentsBySeverity: Record<Severity, number>;
  commentsByType: Record<CommentType, number>;
  averageScore: number;
}

/**
 * Analysis progress state
 */
export interface AnalysisProgress {
  isAnalyzing: boolean;
  currentFile?: string;
  filesProcessed: number;
  totalFiles: number;
  status: ReviewSessionStatus;
}

/**
 * Review Session Models
 * 
 * This module defines TypeScript interfaces and factory functions for
 * review session records stored in PostgreSQL.
 * 
 * A Review Session represents a saved branch comparison with AI-generated
 * inline comments on code changes.
 */

import { Row } from '../database/connection';

/**
 * Review Session status enum
 */
export type ReviewSessionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Review Session interface representing a branch comparison review
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
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * Review File interface representing an analyzed file in a review session
 */
export interface ReviewFile {
  id: string;
  reviewSessionId: string;
  filePath: string;
  score: number | null;
  summary: string | null;
  diffHunks: DiffHunk[];
  analyzedAt: Date;
}

/**
 * Review Comment interface representing an inline AI comment
 */
export interface ReviewComment {
  id: string;
  reviewFileId: string;
  lineNumber: number;
  commentType: 'issue' | 'suggestion' | 'praise' | 'question' | 'todo';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  codeSnippet: string | null;
  suggestion: string | null;
  createdAt: Date;
}

/**
 * Diff line representation for unified diff view
 */
export interface DiffLine {
  type: 'context' | 'added' | 'removed';
  lineNumber: number;
  content: string;
}

/**
 * Diff hunk - a contiguous block of changes in a unified diff
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
 * Data Transfer Object for creating a new review session
 */
export interface CreateReviewSessionDTO {
  repositoryId: string;
  name: string;
  sourceBranch: string;
  targetBranch: string;
  modelId?: string;
}

/**
 * Database row type for review_sessions table
 */
interface ReviewSessionRow {
  id: string;
  repository_id: string;
  name: string;
  source_branch: string;
  target_branch: string;
  model_id: string | null;
  status: string;
  overall_score: number | null;
  created_at: Date;
  completed_at: Date | null;
}

/**
 * Database row type for review_files table
 */
interface ReviewFileRow {
  id: string;
  review_session_id: string;
  file_path: string;
  score: number | null;
  summary: string | null;
  diff_hunks: DiffHunk[];
  analyzed_at: Date;
}

/**
 * Database row type for review_comments table
 */
interface ReviewCommentRow {
  id: string;
  review_file_id: string;
  line_number: number;
  comment_type: string;
  severity: string;
  message: string;
  code_snippet: string | null;
  suggestion: string | null;
  created_at: Date;
}

/**
 * Create a ReviewSession instance from a database row
 */
export function createReviewSession(row: ReviewSessionRow): ReviewSession {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    name: row.name,
    sourceBranch: row.source_branch,
    targetBranch: row.target_branch,
    modelId: row.model_id,
    status: row.status as ReviewSessionStatus,
    overallScore: row.overall_score,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

/**
 * Create an array of ReviewSession instances from database rows
 */
export function createReviewSessionList(rows: ReviewSessionRow[]): ReviewSession[] {
  return rows.map((row) => createReviewSession(row));
}

/**
 * Create a ReviewFile instance from a database row
 */
export function createReviewFile(row: ReviewFileRow): ReviewFile {
  return {
    id: row.id,
    reviewSessionId: row.review_session_id,
    filePath: row.file_path,
    score: row.score,
    summary: row.summary,
    diffHunks: row.diff_hunks || [],
    analyzedAt: new Date(row.analyzed_at),
  };
}

/**
 * Create an array of ReviewFile instances from database rows
 */
export function createReviewFileList(rows: ReviewFileRow[]): ReviewFile[] {
  return rows.map((row) => createReviewFile(row));
}

/**
 * Create a ReviewComment instance from a database row
 */
export function createReviewComment(row: ReviewCommentRow): ReviewComment {
  return {
    id: row.id,
    reviewFileId: row.review_file_id,
    lineNumber: row.line_number,
    commentType: row.comment_type as ReviewComment['commentType'],
    severity: row.severity as ReviewComment['severity'],
    message: row.message,
    codeSnippet: row.code_snippet,
    suggestion: row.suggestion,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Create an array of ReviewComment instances from database rows
 */
export function createReviewCommentList(rows: ReviewCommentRow[]): ReviewComment[] {
  return rows.map((row) => createReviewComment(row));
}

/**
 * Convert a ReviewSession to a database row for insertion
 */
export function toReviewSessionInsertRow(dto: CreateReviewSessionDTO): {
  repository_id: string;
  name: string;
  source_branch: string;
  target_branch: string;
  model_id: string | null;
  status: string;
} {
  return {
    repository_id: dto.repositoryId,
    name: dto.name,
    source_branch: dto.sourceBranch,
    target_branch: dto.targetBranch,
    model_id: dto.modelId || null,
    status: 'pending',
  };
}

/**
 * Convert a ReviewFile to database parameters
 */
export function toReviewFileInsertParams(file: {
  reviewSessionId: string;
  filePath: string;
  diffHunks: DiffHunk[];
}): [
  review_session_id: string,
  file_path: string,
  diff_hunks: string,
] {
  return [
    file.reviewSessionId,
    file.filePath,
    JSON.stringify(file.diffHunks),
  ];
}

/**
 * Convert a ReviewComment to database parameters
 */
export function toReviewCommentInsertParams(comment: Omit<ReviewComment, 'id' | 'createdAt'>): [
  review_file_id: string,
  line_number: number,
  comment_type: string,
  severity: string,
  message: string,
  code_snippet: string | null,
  suggestion: string | null,
] {
  return [
    comment.reviewFileId,
    comment.lineNumber,
    comment.commentType,
    comment.severity,
    comment.message,
    comment.codeSnippet,
    comment.suggestion,
  ];
}

/**
 * Parse unified diff string into structured diff hunks
 */
export function parseUnifiedDiff(diffString: string): DiffHunk[] {
  if (!diffString || typeof diffString !== 'string') {
    return [];
  }

  const hunks: DiffHunk[] = [];
  const lines = diffString.split('\n');
  let currentHunk: DiffHunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    // Check for hunk header
    const hunkMatch = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    
    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      
      const oldStart = parseInt(hunkMatch[1], 10);
      const newStart = parseInt(hunkMatch[2], 10);
      
      currentHunk = {
        oldStart,
        oldLines: 0,
        newStart,
        newLines: 0,
        lines: [],
        header: line,
      };
      
      oldLineNum = oldStart;
      newLineNum = newStart;
      continue;
    }

    // Check for line type
    if (line.startsWith('+') && !line.startsWith('+++')) {
      if (currentHunk) {
        currentHunk.lines.push({
          type: 'added',
          lineNumber: newLineNum++,
          content: line.substring(1),
        });
        currentHunk.newLines++;
      }
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      if (currentHunk) {
        currentHunk.lines.push({
          type: 'removed',
          lineNumber: oldLineNum++,
          content: line.substring(1),
        });
        currentHunk.oldLines++;
      }
    } else if (line.startsWith(' ') || line === '') {
      if (currentHunk) {
        currentHunk.lines.push({
          type: 'context',
          lineNumber: line.startsWith(' ') ? oldLineNum : newLineNum,
          content: line.substring(1) || ' ',
        });
        oldLineNum++;
        newLineNum++;
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Generate a unified diff header for a file
 */
export function generateDiffHeader(oldPath: string, newPath: string): string {
  return `--- ${oldPath}\n+++ ${newPath}`;
}

/**
 * Type guards for validation
 */
export function isValidReviewSessionStatus(status: string): status is ReviewSessionStatus {
  return ['pending', 'in_progress', 'completed', 'failed'].includes(status);
}

export function isValidSeverity(severity: string): severity is ReviewComment['severity'] {
  return ['info', 'warning', 'error', 'critical'].includes(severity);
}

export function isValidCommentType(type: string): type is ReviewComment['commentType'] {
  return ['issue', 'suggestion', 'praise', 'question', 'todo'].includes(type);
}

/**
 * Type for database query results
 */
export type ReviewSessionResult = Row<ReviewSessionRow>;
export type ReviewFileResult = Row<ReviewFileRow>;
export type ReviewCommentResult = Row<ReviewCommentRow>;

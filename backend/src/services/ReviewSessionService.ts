/**
 * ReviewSessionService
 * 
 * This service handles all operations related to review sessions.
 * It manages creating, analyzing, and deleting review sessions with
 * AI-generated inline comments on code changes.
 * 
 * Key responsibilities:
 * - Create review sessions for branch comparisons
 AI analysis * - Execute on changed files
 * - Generate inline comments with line numbers
 * - Retrieve review sessions with files and comments
 */

import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../database/connection';
import {
  ReviewSession,
  ReviewFile,
  ReviewComment,
  ReviewSessionStatus,
  CreateReviewSessionDTO,
  createReviewSession,
  createReviewSessionList,
  createReviewFile,
  createReviewFileList,
  createReviewComment,
  createReviewCommentList,
  DiffHunk,
} from '../models/ReviewSession';
import { DiffService } from './DiffService';
import { AnalysisService } from './AnalysisService';
import { PersistentRepositoryService } from './PersistentRepositoryService';

/**
 * Analysis result from AI for a single file
 */
interface FileAnalysisResult {
  filePath: string;
  summary: string;
  score: number;
  comments: Array<{
    lineNumber: number;
    commentType: ReviewComment['commentType'];
    severity: ReviewComment['severity'];
    message: string;
    codeSnippet: string;
    suggestion: string;
  }>;
  diffHunks: DiffHunk[];
}

/**
 * Service class for managing review sessions
 */
export class ReviewSessionService {
  /**
   * Create a new review session
   * 
   * @param dto The review session creation data
   * @returns Promise<ReviewSession> The created review session
   */
  static async create(dto: CreateReviewSessionDTO): Promise<ReviewSession> {
    // Validate repository exists
    const repo = await PersistentRepositoryService.getById(dto.repositoryId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    // Generate session name if not provided
    const sessionName = dto.name || `${dto.sourceBranch} → ${dto.targetBranch}`;

    // Create the session in the database
    const result = await query(
      `INSERT INTO review_sessions 
       (id, repository_id, name, source_branch, target_branch, model_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [
        uuidv4(),
        dto.repositoryId,
        sessionName,
        dto.sourceBranch,
        dto.targetBranch,
        dto.modelId || null,
      ]
    );

    return createReviewSession(result.rows[0]);
  }

  /**
   * Get all review sessions, optionally filtered by repository
   * 
   * @param repositoryId Optional repository ID to filter by
   * @returns Promise<ReviewSession[]> List of review sessions
   */
  static async getAll(repositoryId?: string): Promise<ReviewSession[]> {
    let queryText = `
      SELECT * FROM review_sessions
    `;
    
    const params: any[] = [];
    
    if (repositoryId) {
      queryText += ' WHERE repository_id = $1';
      params.push(repositoryId);
    }
    
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    return createReviewSessionList(result.rows);
  }

  /**
   * Get a single review session by ID with all files and comments
   * 
   * @param id The review session UUID
   * @returns Promise<ReviewSession | null> The review session with files and comments
   */
  static async getById(id: string): Promise<ReviewSession | null> {
    // Get the session
    const sessionResult = await query(
      'SELECT * FROM review_sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return null;
    }

    const session = createReviewSession(sessionResult.rows[0]);

    // Get all files for this session
    const filesResult = await query(
      'SELECT * FROM review_files WHERE review_session_id = $1 ORDER BY file_path',
      [id]
    );
    session.files = createReviewFileList(filesResult.rows);

    // Get all comments for each file
    for (const file of session.files) {
      const commentsResult = await query(
        'SELECT * FROM review_comments WHERE review_file_id = $1 ORDER BY line_number',
        [file.id]
      );
      file.comments = createReviewCommentList(commentsResult.rows);
    }

    return session;
  }

  /**
   * Run AI analysis on a review session
   * This will analyze all changed files and generate inline comments
   * 
   * @param id The review session UUID
   * @param modelId The AI model to use for analysis
   * @returns Promise<ReviewSession> The updated review session
   */
  static async runAnalysis(id: string, modelId?: string): Promise<ReviewSession> {
    const session = await this.getById(id);
    
    if (!session) {
      throw new Error('Review session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Analysis has already been run for this session');
    }

    // Update status to in_progress
    await query(
      `UPDATE review_sessions SET status = 'in_progress' WHERE id = $1`,
      [id]
    );

    try {
      // Get changed files
      const changedFiles = await DiffService.getChangedFilesList(
        session.repositoryId,
        session.sourceBranch,
        session.targetBranch
      );

      if (changedFiles.length === 0) {
        // No changes to analyze
        await this.markComplete(id, null);
        return this.getById(id)!;
      }

      // Analyze each changed file
      const results: FileAnalysisResult[] = [];
      
      for (const file of changedFiles) {
        try {
          const result = await this.analyzeFile(
            session.repositoryId,
            file.path,
            session.sourceBranch,
            session.targetBranch,
            modelId || session.modelId || undefined
          );
          results.push(result);
        } catch (error) {
          console.error(`Failed to analyze file ${file.path}:`, error);
          // Continue with other files
        }
      }

      // Save results to database
      await this.saveAnalysisResults(id, results);

      // Calculate and update overall score
      const overallScore = this.calculateOverallScore(results);
      await this.markComplete(id, overallScore);

      console.log(`Analysis completed for review session: ${id}`);

      return this.getById(id)!;
    } catch (error: any) {
      // Mark as failed
      await query(
        `UPDATE review_sessions SET status = 'failed' WHERE id = $1`,
        [id]
      );
      throw error;
    }
  }

  /**
   * Analyze a single file with AI
   * 
   * @param repoId Repository UUID
   * @param filePath Path to the file
   * @param sourceBranch Source branch
   * @param targetBranch Target branch
   * @param modelId Optional model ID
   * @returns Promise<FileAnalysisResult> Analysis result
   */
  private static async analyzeFile(
    repoId: string,
    filePath: string,
    sourceBranch: string,
    targetBranch: string,
    modelId?: string
  ): Promise<FileAnalysisResult> {
    // Get diff hunks for the file
    const diffHunks = await DiffService.getFileDiff(
      repoId,
      sourceBranch,
      targetBranch,
      filePath
    );

    // Get file content from source branch
    const content = await DiffService.getFileContentFromBranch(
      repoId,
      sourceBranch,
      filePath
    );

    // Generate context for AI analysis
    const context = this.generateDiffContext(diffHunks);

    // Analyze with AI
    const analysisResult = await AnalysisService.analyzeCodeWithDiff(
      content,
      filePath,
      modelId,
      context
    );

    // Parse AI response and create comments
    const comments = this.parseAnalysisResponse(
      analysisResult,
      diffHunks
    );

    return {
      filePath,
      summary: analysisResult.summary || '',
      score: analysisResult.overallScore || 0,
      comments,
      diffHunks,
    };
  }

  /**
   * Generate context string for AI from diff hunks
   */
  private static generateDiffContext(hunks: DiffHunk[]): string {
    const lines: string[] = [];
    
    for (const hunk of hunks) {
      lines.push(`// Hunk: ${hunk.oldStart}-${hunk.oldStart + hunk.oldLines - 1} → ${hunk.newStart}-${hunk.newStart + hunk.newLines - 1}`);
      
      for (const line of hunk.lines) {
        const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
        lines.push(`${prefix} ${line.content}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Parse AI analysis response into structured comments
   */
  private static parseAnalysisResponse(
    analysisResult: { issues: Array<{
      line?: number;
      message: string;
      severity: string;
      type: string;
      code?: string;
      suggestion?: string;
    }> },
    diffHunks: DiffHunk[]
  ): FileAnalysisResult['comments'] {
    const comments: FileAnalysisResult['comments'] = [];
    
    for (const issue of analysisResult.issues || []) {
      // Find the line number in the new file
      let lineNumber = issue.line || 1;
      
      // If line number is specified relative to the diff, adjust it
      if (issue.line && issue.line > 0) {
        lineNumber = this.findNewLineNumber(diffHunks, issue.line);
      }

      comments.push({
        lineNumber,
        commentType: (issue.type as ReviewComment['commentType']) || 'issue',
        severity: (issue.severity as ReviewComment['severity']) || 'info',
        message: issue.message,
        codeSnippet: issue.code || null,
        suggestion: issue.suggestion || null,
      });
    }
    
    return comments;
  }

  /**
   * Find the corresponding line number in the new file
   */
  private static findNewLineNumber(hunks: DiffHunk[], oldLineNumber: number): number {
    let newLineNumber = 0;
    let offset = 0;

    for (const hunk of hunks) {
      if (oldLineNumber < hunk.oldStart) {
        // Line is before this hunk
        return newLineNumber + (oldLineNumber - offset) + 1;
      }

      if (oldLineNumber >= hunk.oldStart && oldLineNumber < hunk.oldStart + hunk.oldLines) {
        // Line is within this hunk
        for (const line of hunk.lines) {
          if (line.type !== 'removed' && line.lineNumber === oldLineNumber) {
            return line.lineNumber;
          }
        }
        return hunk.newStart;
      }

      // Move past this hunk
      const linesInHunk = hunk.lines.filter(l => l.type !== 'removed').length;
      offset += hunk.oldLines - linesInHunk;
      newLineNumber += linesInHunk;
    }

    return oldLineNumber - offset;
  }

  /**
   * Save analysis results to the database
   */
  private static async saveAnalysisResults(
    sessionId: string,
    results: FileAnalysisResult[]
  ): Promise<void> {
    await withTransaction(async (client) => {
      for (const result of results) {
        // Insert the file
        const fileResult = await client.query(
          `INSERT INTO review_files 
           (id, review_session_id, file_path, score, summary, diff_hunks)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            uuidv4(),
            sessionId,
            result.filePath,
            result.score,
            result.summary,
            JSON.stringify(result.diffHunks),
          ]
        );

        const fileId = fileResult.rows[0].id;

        // Insert comments
        for (const comment of result.comments) {
          await client.query(
            `INSERT INTO review_comments 
             (id, review_file_id, line_number, comment_type, severity, message, code_snippet, suggestion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              uuidv4(),
              fileId,
              comment.lineNumber,
              comment.commentType,
              comment.severity,
              comment.message,
              comment.codeSnippet,
              comment.suggestion,
            ]
          );
        }
      }
    });
  }

  /**
   * Calculate overall score from analysis results
   */
  private static calculateOverallScore(results: FileAnalysisResult[]): number {
    if (results.length === 0) {
      return 100;
    }

    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.round(totalScore / results.length);
  }

  /**
   * Mark a review session as complete
   */
  private static async markComplete(
    id: string,
    overallScore: number | null
  ): Promise<void> {
    await query(
      `UPDATE review_sessions 
       SET status = 'completed', overall_score = $2, completed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, overallScore]
    );
  }

  /**
   * Delete a review session and all related data
   * 
   * @param id The review session UUID
   * @returns Promise<boolean> True if deleted successfully
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM review_sessions WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get review sessions by status
   * 
   * @param status The status to filter by
   * @returns Promise<ReviewSession[]> List of review sessions
   */
  static async getByStatus(status: ReviewSessionStatus): Promise<ReviewSession[]> {
    const result = await query(
      'SELECT * FROM review_sessions WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );

    return createReviewSessionList(result.rows);
  }

  /**
   * Check if a review session exists
   * 
   * @param id The review session UUID
   * @returns Promise<boolean> True if exists
   */
  static async exists(id: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM review_sessions WHERE id = $1',
      [id]
    );

    return result.rows.length > 0;
  }
}

/**
 * DiffService
 * 
 * This service handles git diff operations for comparing branches and
 * parsing unified diff output into structured formats suitable for
 * frontend display.
 * 
 * Key responsibilities:
 * - Generate unified diffs between branches
 * - Parse diff output into structured hunks and lines
 * - List changed files between branches
 */

import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import {
  DiffHunk,
  DiffLine,
  parseUnifiedDiff,
  generateDiffHeader,
} from '../models/ReviewSession';
import { validateRepoPath, validateBranchName, validateFilePath } from '../utils/PathValidator';
import { GitErrorParser } from '../utils/GitErrorParser';

/**
 * Get the persistent storage base path from environment
 */
function getPersistentStoragePath(): string {
  return process.env.PERSISTENT_REPOS_PATH || '/data/repos';
}

/**
 * Service class for git diff operations
 */
export class DiffService {
  /**
   * Get the unified diff for a specific file between two branches
   * 
   * @param repoId The repository UUID
   * @param sourceBranch The source branch name
   * @param targetBranch The target branch name
   * @param filePath The path to the file
   * @returns Promise<DiffHunk[]> Array of diff hunks
   */
  static async getFileDiff(
    repoId: string,
    sourceBranch: string,
    targetBranch: string,
    filePath: string
  ): Promise<DiffHunk[]> {
    // Validate inputs
    const repoPath = validateRepoPath(repoId, getPersistentStoragePath());
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!validateBranchName(sourceBranch)) {
      throw new Error('Invalid source branch name');
    }

    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name');
    }

    if (!validateFilePath(filePath, repoPath)) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      // Fetch both branches to ensure we have the latest
      await git.fetch('origin', sourceBranch);
      await git.fetch('origin', targetBranch);

      // Generate the diff
      const diffOutput = await git.diff([
        `origin/${targetBranch}`,
        `origin/${sourceBranch}`,
        '--',
        filePath,
      ]);

      // Parse the diff output
      const hunks = parseUnifiedDiff(diffOutput);
      
      return hunks;
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, sourceBranch);
      throw new Error(parsedError.message);
    }
  }

  /**
   * Get a list of changed files between two branches
   * 
   * @param repoId The repository UUID
   * @param sourceBranch The source branch name
   * @param targetBranch The target branch name
   * @returns Promise<Array<{path: string; additions: number; deletions: number}>> List of changed files
   */
  static async getChangedFilesList(
    repoId: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<Array<{ path: string; additions: number; deletions: number }>> {
    // Validate inputs
    const repoPath = validateRepoPath(repoId, getPersistentStoragePath());
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!validateBranchName(sourceBranch)) {
      throw new Error('Invalid source branch name');
    }

    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      // Fetch both branches
      await git.fetch('origin', sourceBranch);
      await git.fetch('origin', targetBranch);

      // Get the diff summary
      const diffSummary = await git.diffSummary([
        `origin/${targetBranch}`,
        `origin/${sourceBranch}`,
      ]);

      // Filter and format the results
      const changedFiles = diffSummary.files
        .filter((file) => !file.binary) // Skip binary files
        .map((file) => ({
          path: file.file,
          additions: file.insertions,
          deletions: file.deletions,
        }));

      return changedFiles;
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, sourceBranch);
      throw new Error(parsedError.message);
    }
  }

  /**
   * Get the raw diff output for a file between two branches
   * 
   * @param repoId The repository UUID
   * @param sourceBranch The source branch name
   * @param targetBranch The target branch name
   * @param filePath The path to the file
   * @returns Promise<string> Raw unified diff string
   */
  static async getRawFileDiff(
    repoId: string,
    sourceBranch: string,
    targetBranch: string,
    filePath: string
  ): Promise<string> {
    const repoPath = validateRepoPath(repoId, getPersistentStoragePath());
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!validateBranchName(sourceBranch)) {
      throw new Error('Invalid source branch name');
    }

    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      await git.fetch('origin', sourceBranch);
      await git.fetch('origin', targetBranch);

      const diffOutput = await git.diff([
        `origin/${targetBranch}`,
        `origin/${sourceBranch}`,
        '--',
        filePath,
      ]);

      return generateDiffHeader(filePath, filePath) + '\n' + diffOutput;
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, sourceBranch);
      throw new Error(parsedError.message);
    }
  }

  /**
   * Get the content of a file from a specific branch
   * 
   * @param repoId The repository UUID
   * @param branch The branch name
   * @param filePath The path to the file
   * @returns Promise<string> File content
   */
  static async getFileContentFromBranch(
    repoId: string,
    branch: string,
    filePath: string
  ): Promise<string> {
    const repoPath = validateRepoPath(repoId, getPersistentStoragePath());
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!validateBranchName(branch)) {
      throw new Error('Invalid branch name');
    }

    if (!validateFilePath(filePath, repoPath)) {
      throw new Error('Invalid file path');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      await git.fetch('origin', branch);

      const fullPath = path.join(repoPath, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file from branch: ${error.message}`);
    }
  }

  /**
   * Format diff hunks for display (GitLab-style)
   * 
   * @param hunks Array of diff hunks
   * @returns Formatted diff lines for display
   */
  static formatDiffForDisplay(hunks: DiffHunk[]): Array<{
    lineNumber: number;
    type: DiffLine['type'];
    content: string;
    isHeader?: boolean;
  }> {
    const lines: Array<{
      lineNumber: number;
      type: DiffLine['type'];
      content: string;
      isHeader?: boolean;
    }> = [];

    for (const hunk of hunks) {
      // Add hunk header as a special line
      lines.push({
        lineNumber: 0,
        type: 'context',
        content: hunk.header,
        isHeader: true,
      });

      // Add all lines in the hunk
      for (const line of hunk.lines) {
        lines.push({
          lineNumber: line.lineNumber,
          type: line.type,
          content: line.content,
        });
      }
    }

    return lines;
  }

  /**
   * Calculate line number mapping for comments
   * Maps new file line numbers to diff line indices
   * 
   * @param hunks Array of diff hunks
   * @param targetLineNumber The line number in the new file
   * @returns The diff line index containing the target line, or null
   */
  static findDiffLineIndex(
    hunks: DiffHunk[],
    targetLineNumber: number
  ): number | null {
    let lineIndex = 0;

    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type !== 'removed' && line.lineNumber === targetLineNumber) {
          return lineIndex;
        }
        lineIndex++;
      }
    }

    return null;
  }

  /**
   * Get a summary of changes for a file
   * 
   * @param hunks Array of diff hunks
   * @returns Summary object with change statistics
   */
  static getDiffSummary(hunks: DiffHunk[]): {
    additions: number;
    deletions: number;
    changes: number;
    filesChanged: number;
  } {
    let additions = 0;
    let deletions = 0;

    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'added') {
          additions++;
        } else if (line.type === 'removed') {
          deletions++;
        }
      }
    }

    return {
      additions,
      deletions,
      changes: additions + deletions,
      filesChanged: hunks.length > 0 ? 1 : 0,
    };
  }
}

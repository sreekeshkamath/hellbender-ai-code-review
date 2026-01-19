import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import { REPOS_DIR } from '../config/constants';
import { validateRepoPath, validateBranchName } from '../utils/PathValidator';
import { GitErrorParser } from '../utils/GitErrorParser';

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface FileDiff {
  filePath: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: Date;
}

export class DiffService {
  /**
   * Get diff between two branches for a specific repository
   */
  static async getDiff(
    repoId: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<FileDiff[]> {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    // Validate branch names to prevent command injection
    if (!validateBranchName(sourceBranch)) {
      throw new Error('Invalid source branch name');
    }
    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      // Fetch both branches if needed
      await git.fetch('origin', sourceBranch).catch(() => {});
      await git.fetch('origin', targetBranch).catch(() => {});

      // Get the diff output
      const diffOutput = await git.diff([`origin/${targetBranch}`, `origin/${sourceBranch}`]);

      // Parse the diff output
      return this.parseDiff(diffOutput);
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, sourceBranch);
      throw new Error(parsedError.message);
    }
  }

  /**
   * Get diff for a specific file between two branches
   */
  static async getFileDiff(
    repoId: string,
    filePath: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<FileDiff | null> {
    const allDiffs = await this.getDiff(repoId, sourceBranch, targetBranch);
    return allDiffs.find(diff => diff.filePath === filePath) || null;
  }

  /**
   * Parse unified diff output into structured format
   */
  private static parseDiff(diffOutput: string): FileDiff[] {
    if (!diffOutput || !diffOutput.trim()) {
      return [];
    }

    const files: FileDiff[] = [];
    const lines = diffOutput.split('\n');
    let currentFile: FileDiff | null = null;
    let currentHunk: DiffHunk | null = null;
    let oldLineNumber: number | null = null;
    let newLineNumber: number | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // File header: "diff --git a/path b/path" or "--- a/path" / "+++ b/path"
      if (line.startsWith('diff --git')) {
        // Save previous file if exists
        if (currentFile && currentHunk) {
          currentFile.hunks.push(currentHunk);
        }
        if (currentFile) {
          files.push(currentFile);
        }

        // Extract file path from "diff --git a/path b/path"
        const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
        if (match) {
          const newPath = match[2];
          currentFile = {
            filePath: newPath,
            additions: 0,
            deletions: 0,
            hunks: []
          };
          currentHunk = null;
        }
        continue;
      }

      // File path header: "--- a/path" or "+++ b/path"
      if (line.startsWith('--- a/') || line.startsWith('+++ b/')) {
        continue;
      }

      // Hunk header: "@@ -oldStart,oldLines +newStart,newLines @@"
      if (line.startsWith('@@')) {
        // Save previous hunk if exists
        if (currentHunk && currentFile) {
          currentFile.hunks.push(currentHunk);
        }

        const hunkMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (hunkMatch && currentFile) {
          const oldStart = parseInt(hunkMatch[1], 10);
          const oldLines = parseInt(hunkMatch[2] || '1', 10);
          const newStart = parseInt(hunkMatch[3], 10);
          const newLines = parseInt(hunkMatch[4] || '1', 10);

          currentHunk = {
            oldStart,
            oldLines,
            newStart,
            newLines,
            lines: []
          };

          // Initialize line numbers
          oldLineNumber = oldStart;
          newLineNumber = newStart;
        }
        continue;
      }

      // Diff lines
      if (currentHunk && currentFile) {
        let type: 'context' | 'addition' | 'deletion';
        let content: string;
        let oldNum: number | null = null;
        let newNum: number | null = null;

        if (line.startsWith('+') && !line.startsWith('+++')) {
          // Addition
          type = 'addition';
          content = line.substring(1);
          newNum = newLineNumber!;
          newLineNumber!++;
          currentFile.additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          // Deletion
          type = 'deletion';
          content = line.substring(1);
          oldNum = oldLineNumber!;
          oldLineNumber!++;
          currentFile.deletions++;
        } else if (line.startsWith(' ')) {
          // Context
          type = 'context';
          content = line.substring(1);
          oldNum = oldLineNumber!;
          newNum = newLineNumber!;
          oldLineNumber!++;
          newLineNumber!++;
        } else {
          // Skip other lines (like "\ No newline at end of file")
          continue;
        }

        currentHunk.lines.push({
          type,
          oldLineNumber: oldNum,
          newLineNumber: newNum,
          content
        });
      }
    }

    // Save last hunk and file
    if (currentHunk && currentFile) {
      currentFile.hunks.push(currentHunk);
    }
    if (currentFile) {
      files.push(currentFile);
    }

    return files;
  }

  /**
   * Get commits between two branches for a specific repository
   */
  static async getCommits(
    repoId: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<Commit[]> {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    // Validate branch names to prevent command injection
    if (!validateBranchName(sourceBranch)) {
      throw new Error('Invalid source branch name');
    }
    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      // Fetch both branches if needed
      await git.fetch('origin', sourceBranch).catch(() => {});
      await git.fetch('origin', targetBranch).catch(() => {});

      // Get commits that are in sourceBranch but not in targetBranch
      // Using range syntax: targetBranch..sourceBranch shows commits in sourceBranch not in targetBranch
      const log = await git.log([
        `origin/${targetBranch}..origin/${sourceBranch}`
      ]);

      return log.all.map(commit => ({
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date)
      }));
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, sourceBranch);
      throw new Error(parsedError.message);
    }
  }
}

import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from '../models/Repository';
import { FileInfo } from '../models/FileInfo';
import { FileService } from './FileService';
import { RepositoryMappingService } from './RepositoryMappingService';
import { REPOS_DIR, GITHUB_ACCESS_TOKEN } from '../config/constants';
import { GitErrorParser } from '../utils/GitErrorParser';
import { validateRepoPath, validateFilePath, validateBranchName } from '../utils/PathValidator';

export class RepositoryService {
  private static isValidRepoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    // Must be a valid Git URL: http://, https://, git@, or git://
    const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
    return gitUrlPattern.test(url.trim());
  }

  static async clone(repoUrl: string, branch: string = 'main', accessToken?: string): Promise<Repository> {
    if (!this.isValidRepoUrl(repoUrl)) {
      throw new Error('Please enter a valid Git repository URL (e.g., https://github.com/username/repo)');
    }

    // Validate branch name to prevent command injection
    if (!validateBranchName(branch)) {
      throw new Error('Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.');
    }

    // Check if repository is already cloned
    let repoId = RepositoryMappingService.getRepoId(repoUrl, branch);

    if (repoId && RepositoryMappingService.repoExists(repoId, REPOS_DIR)) {
      // Repository already exists, return existing data
      const repoPath = path.join(REPOS_DIR, repoId);
      const filePaths = FileService.getAllFiles(repoPath);
      const files: FileInfo[] = filePaths.map(f => ({
        path: path.relative(repoPath, f),
        size: fs.statSync(f).size
      }));

      console.log(`Reusing existing repository: ${repoUrl} (${branch}) -> ${repoId}`);

      return {
        repoId,
        repoPath,
        files,
        cached: true
      };
    }

    // Repository doesn't exist, clone it
    repoId = uuidv4();
    const repoPath = path.join(REPOS_DIR, repoId);
    const git: SimpleGit = simpleGit();

    const authRepoUrl = accessToken
      ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
      : repoUrl;

    console.log(`Cloning new repository: ${repoUrl} (${branch}) -> ${repoId}`);

    // Use simple-git instead of exec() to prevent command injection
    // simple-git properly escapes arguments, making it safe from injection attacks
    const cloneOptions: string[] = ['--depth', '1'];
    if (branch !== 'main') {
      cloneOptions.push('--branch', branch, '--single-branch');
    }

    try {
      await git.clone(authRepoUrl, repoPath, cloneOptions);
    } catch (error: any) {
      // Use structured error parser for simple-git errors
      const parsedError = GitErrorParser.parseSimpleGitError(error, branch);
      throw new Error(parsedError.message);
    }

    // Store the mapping
    RepositoryMappingService.setRepoId(repoUrl, branch, repoId);

    const filePaths = FileService.getAllFiles(repoPath);
    const files: FileInfo[] = filePaths.map(f => ({
      path: path.relative(repoPath, f),
      size: fs.statSync(f).size
    }));

    return {
      repoId,
      repoPath,
      files,
      cached: false
    };
  }

  static async sync(repoId: string, repoUrl: string, branch: string = 'main', accessToken?: string): Promise<Repository> {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    if (!repoUrl) {
      throw new Error('Repository URL is required for sync');
    }

    // Validate branch name to prevent command injection
    if (!validateBranchName(branch)) {
      throw new Error('Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.');
    }

    const git: SimpleGit = simpleGit(repoPath);
    const authRepoUrl = accessToken
      ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
      : repoUrl;

    try {
      await git.fetch('origin', branch);
      await git.reset(['--hard', `origin/${branch}`]);
    } catch (error: any) {
      // Use structured error parser for simple-git errors
      const parsedError = GitErrorParser.parseSimpleGitError(error, branch);
      
      // Throw with the parsed error message (already user-friendly)
      throw new Error(parsedError.message);
    }

    const filePaths = FileService.getAllFiles(repoPath);
    const files: FileInfo[] = filePaths.map(f => ({
      path: path.relative(repoPath, f),
      size: fs.statSync(f).size
    }));

    return {
      repoId,
      repoPath,
      files,
      cached: false
    };
  }

  static getFiles(repoId: string): FileInfo[] {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    const filePaths = FileService.getAllFiles(repoPath);
    return filePaths.map(f => ({
      path: path.relative(repoPath, f),
      size: fs.statSync(f).size
    }));
  }

  static getFile(repoId: string, filePath: string): string {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    // Validate file path to prevent path traversal
    const validatedFilePath = validateFilePath(filePath, repoPath);
    if (!validatedFilePath) {
      throw new Error('Invalid file path');
    }

    const fullPath = path.join(repoPath, validatedFilePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }

  static delete(repoId: string): void {
    // Validate repoId to prevent path traversal attacks
    // This is critical as we use fs.rmSync with recursive: true
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    // Remove from mappings
    const mappings = RepositoryMappingService.getAllMappings();
    for (const [key, mappedRepoId] of Object.entries(mappings)) {
      if (mappedRepoId === repoId) {
        const parsed = RepositoryMappingService.parseKey(key);
        if (parsed) {
          RepositoryMappingService.removeMapping(parsed.repoUrl, parsed.branch);
        } else {
          console.warn(`Invalid mapping key format: ${key}`);
        }
        break;
      }
    }

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }

  static cloneWithDefaults(repoUrl: string, branch?: string): Promise<Repository> {
    return this.clone(repoUrl, branch, GITHUB_ACCESS_TOKEN);
  }

  static syncWithDefaults(repoId: string, repoUrl: string, branch?: string): Promise<Repository> {
    return this.sync(repoId, repoUrl, branch, GITHUB_ACCESS_TOKEN);
  }

  static async getChangedFiles(repoId: string, targetBranch: string, currentBranch?: string): Promise<FileInfo[]> {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    // Validate branch names to prevent command injection
    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      // Fetch all branches to ensure we have both branches
      await git.fetch(['--all']);

      // Get the current branch if not specified
      if (!currentBranch) {
        const branchSummary = await git.branchLocal();
        currentBranch = branchSummary.current || 'main';
      }

      // Validate current branch name if provided
      if (currentBranch && !validateBranchName(currentBranch)) {
        throw new Error('Invalid current branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.');
      }

      // Get changed files: files that differ between targetBranch and currentBranch
      // This shows what has changed in currentBranch compared to targetBranch
      const diffSummary = await git.diffSummary([`origin/${targetBranch}`, `origin/${currentBranch}`]);

      // Filter only modified and added files (exclude deleted)
      const changedFiles: FileInfo[] = [];

      for (const file of diffSummary.files) {
        if (file.binary) continue; // Skip binary files
        // Skip files that were only deleted (no insertions, only deletions)
        if (file.insertions === 0 && file.deletions > 0) continue;

        // Check if file exists in current branch (it should since we're on it)
        const filePath = path.join(repoPath, file.file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          changedFiles.push({
            path: file.file,
            size: stats.size
          });
        }
      }

      return changedFiles;
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, targetBranch);
      throw new Error(parsedError.message);
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from '../models/Repository';
import { FileInfo } from '../models/FileInfo';
import { FileService } from './FileService';
import { RepositoryMappingService } from './RepositoryMappingService';
import { MRCloneService } from './MRCloneService';
import { SavedRepositoryService } from './SavedRepositoryService';
import { REPOS_DIR, GITHUB_ACCESS_TOKEN } from '../config/constants';
import { GitErrorParser } from '../utils/GitErrorParser';
import { validateRepoPath, validateFilePath, validateBranchName } from '../utils/PathValidator';

export interface ClonedRepositoryInfo {
  repoId: string;
  repoUrl: string;
  branch: string;
  repoPath: string;
}

// Ensure REPOS_DIR exists before any operations
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

export class RepositoryService {
  private static isValidRepoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    // Must be a valid Git URL: http://, https://, git@, or git://
    const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
    return gitUrlPattern.test(url.trim());
  }

  /**
   * Validates that a URL is from GitHub domain.
   * This prevents leaking GitHub access tokens to non-GitHub servers.
   */
  private static isGitHubUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmedUrl = url.trim();

    // Check for GitHub domains in various URL formats:
    // - https://github.com/...
    // - https://www.github.com/...
    // - git@github.com:...
    // - git://github.com/...
    const githubPatterns = [
      /^https?:\/\/(www\.)?github\.com\//i,
      /^git@github\.com:/i,
      /^git:\/\/github\.com\//i,
    ];

    return githubPatterns.some(pattern => pattern.test(trimmedUrl));
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

      // Ensure repository is saved to SavedRepository database
      try {
        const existingRepos = SavedRepositoryService.getAll();
        const existing = existingRepos.find(r => r.url.toLowerCase() === repoUrl.toLowerCase() && r.branch === branch);

        if (existing) {
          // Update existing repository with repoId and cloned status if needed
          if (existing.repoId !== repoId || !existing.cloned) {
            SavedRepositoryService.update(existing.id, {
              repoId,
              cloned: true
            });
            console.log(`Updated existing saved repository: ${repoUrl} (${branch})`);
          }
        } else {
          // Create new saved repository entry for already-cloned repo
          SavedRepositoryService.add({
            url: repoUrl,
            branch,
            repoId,
            cloned: true
          });
          console.log(`Saved existing cloned repository to database: ${repoUrl} (${branch})`);
        }
      } catch (error) {
        // Log error but don't fail the operation
        console.error('Error saving repository to database:', error);
      }

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

    // Only apply GitHub access token to GitHub URLs to prevent credential leakage
    // This is a security measure: we should never send GitHub tokens to non-GitHub servers
    let authRepoUrl = repoUrl;
    if (accessToken) {
      if (this.isGitHubUrl(repoUrl)) {
        // Inject token for HTTPS GitHub URLs (GitHub uses HTTPS, not HTTP)
        authRepoUrl = repoUrl.replace(/^https:\/\//, `https://oauth2:${accessToken}@`);
      } else {
        // Log warning if token is provided for non-GitHub URL (shouldn't happen in normal operation)
        console.warn(`GitHub access token provided but URL is not from GitHub: ${repoUrl}. Token will not be used.`);
      }
    }

    console.log(`Cloning new repository: ${repoUrl} (${branch}) -> ${repoId}`);

    // Use simple-git instead of exec() to prevent command injection
    // simple-git properly escapes arguments, making it safe from injection attacks
    // Always specify the branch explicitly to ensure we clone the requested branch,
    // even if it's 'main' (the repo's default branch might be 'master' or something else)
    const cloneOptions: string[] = ['--depth', '1', '--branch', branch];

    try {
      await git.clone(authRepoUrl, repoPath, cloneOptions);
    } catch (error: any) {
      // Clean up the directory if it was created during the failed clone attempt
      // This prevents orphaned directories from accumulating in the temp folder
      if (fs.existsSync(repoPath)) {
        try {
          fs.rmSync(repoPath, { recursive: true, force: true });
          console.log(`Cleaned up failed clone directory: ${repoPath}`);
        } catch (cleanupError: any) {
          // Log cleanup errors but don't fail the operation - the main error is more important
          console.warn(`Failed to clean up directory ${repoPath}:`, cleanupError.message);
        }
      }

      // Use structured error parser for simple-git errors
      const parsedError = GitErrorParser.parseSimpleGitError(error, branch);
      throw new Error(parsedError.message);
    }

    // Store the mapping
    RepositoryMappingService.setRepoId(repoUrl, branch, repoId);

    // Auto-save repository to SavedRepository database
    try {
      const existingRepos = SavedRepositoryService.getAll();
      const existing = existingRepos.find(r => r.url.toLowerCase() === repoUrl.toLowerCase() && r.branch === branch);

      if (existing) {
        // Update existing repository with repoId and cloned status
        SavedRepositoryService.update(existing.id, {
          repoId,
          cloned: true
        });
        console.log(`Updated existing saved repository: ${repoUrl} (${branch})`);
      } else {
        // Create new saved repository entry
        SavedRepositoryService.add({
          url: repoUrl,
          branch,
          repoId,
          cloned: true
        });
        console.log(`Saved cloned repository to database: ${repoUrl} (${branch})`);
      }
    } catch (error) {
      // Log error but don't fail the clone operation
      console.error('Error saving repository to database:', error);
    }

    // Clone associated MRs if source repo exists
    const sourceRepoId = this.getSourceRepoId(repoUrl, branch);
    if (sourceRepoId && sourceRepoId !== repoId) {
      try {
        const clonedMRs = await MRCloneService.cloneMergeRequests(sourceRepoId, repoId);
        console.log(`Cloned ${clonedMRs.length} merge requests from source repository`);
      } catch (error) {
        // Log error but don't fail the clone operation
        console.error('Error cloning merge requests:', error);
      }
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

  /**
   * Gets the source repository ID for a given URL and branch.
   * Returns null if no source repository exists.
   */
  static getSourceRepoId(repoUrl: string, branch: string): string | null {
    return RepositoryMappingService.getRepoId(repoUrl, branch);
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

    // Only apply GitHub access token to GitHub URLs to prevent credential leakage
    // This is a security measure: we should never send GitHub tokens to non-GitHub servers
    let authRepoUrl = repoUrl;
    if (accessToken) {
      if (this.isGitHubUrl(repoUrl)) {
        // Inject token for HTTPS GitHub URLs (GitHub uses HTTPS, not HTTP)
        authRepoUrl = repoUrl.replace(/^https:\/\//, `https://oauth2:${accessToken}@`);
      } else {
        // Log warning if token is provided for non-GitHub URL (shouldn't happen in normal operation)
        console.warn(`GitHub access token provided but URL is not from GitHub: ${repoUrl}. Token will not be used.`);
      }
    }

    try {
      // Ensure the remote exists and update it with the authenticated URL
      // This is critical: without updating the remote URL, git.fetch('origin', branch)
      // will use the old URL from .git/config, ignoring the authRepoUrl we constructed
      const remotes = await git.getRemotes(true);
      const originExists = remotes.some(remote => remote.name === 'origin');

      if (originExists) {
        // Update existing remote URL with the authenticated URL
        await git.remote(['set-url', 'origin', authRepoUrl]);
      } else {
        // Add remote if it doesn't exist
        await git.addRemote('origin', authRepoUrl);
      }

      // Now fetch from 'origin' - this will use the updated authenticated URL
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

    // Remove from mappings and get repo info for SavedRepository deletion
    const mappings = RepositoryMappingService.getAllMappings();
    let repoUrl: string | null = null;
    let branch: string | null = null;

    for (const [key, mappedRepoId] of Object.entries(mappings)) {
      if (mappedRepoId === repoId) {
        const parsed = RepositoryMappingService.parseKey(key);
        if (parsed) {
          repoUrl = parsed.repoUrl;
          branch = parsed.branch;
          RepositoryMappingService.removeMapping(parsed.repoUrl, parsed.branch);
        } else {
          console.warn(`Invalid mapping key format: ${key}`);
        }
        break;
      }
    }

    // Remove from SavedRepository database
    if (repoUrl && branch) {
      try {
        const savedRepos = SavedRepositoryService.getAll();
        const savedRepo = savedRepos.find(r => r.repoId === repoId || (r.url.toLowerCase() === repoUrl!.toLowerCase() && r.branch === branch));
        if (savedRepo) {
          SavedRepositoryService.delete(savedRepo.id);
          console.log(`Removed repository from SavedRepository database: ${repoUrl} (${branch})`);
        }
      } catch (error) {
        // Log error but don't fail the delete operation
        console.error('Error removing repository from SavedRepository database:', error);
      }
    }

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }

  static cloneWithDefaults(repoUrl: string, branch?: string): Promise<Repository> {
    return this.clone(repoUrl, branch ?? 'main', GITHUB_ACCESS_TOKEN);
  }

  static syncWithDefaults(repoId: string, repoUrl: string, branch?: string): Promise<Repository> {
    return this.sync(repoId, repoUrl, branch ?? 'main', GITHUB_ACCESS_TOKEN);
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
      // Get the current branch if not specified
      if (!currentBranch) {
        const branchSummary = await git.branchLocal();
        currentBranch = branchSummary.current || 'main';
      }

      // Validate current branch name if provided
      if (currentBranch && !validateBranchName(currentBranch)) {
        throw new Error('Invalid current branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.');
      }

      // Fetch the specific branches we need for comparison
      // Since clone uses --single-branch, we need to explicitly fetch other branches
      // Fetch target branch first
      await git.fetch('origin', targetBranch);
      // Fetch current branch if it's different from target branch
      if (currentBranch !== targetBranch) {
        await git.fetch('origin', currentBranch);
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

  /**
   * Get all branches (local and remote) for a repository
   */
  static async getBranches(repoId: string): Promise<string[]> {
    // Validate repoId to prevent path traversal
    const repoPath = validateRepoPath(repoId, REPOS_DIR);
    if (!repoPath) {
      throw new Error('Invalid repository ID');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    const git: SimpleGit = simpleGit(repoPath);

    try {
      // Get the remote URL first
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(r => r.name === 'origin');

      let remoteBranches: string[] = [];
      if (origin) {
        // Try ls-remote to get all branches from origin without fetching everything
        const lsRemote = await git.listRemote(['--heads', 'origin']);
        remoteBranches = lsRemote.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split('refs/heads/');
            return parts.length > 1 ? parts[1].trim() : '';
          })
          .filter(Boolean);
      }

      // Get local branches too
      const branchSummary = await git.branch();
      const localBranches = branchSummary.all.map(b => b.replace(/^remotes\/origin\//, '').replace(/^HEAD -> /, '').replace(/^remotes\//, ''));

      // Combine and unique
      const allBranches = Array.from(new Set([...localBranches, ...remoteBranches]));

      return allBranches
        .filter(b => b !== 'HEAD')
        .sort();
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, '');
      throw new Error(parsedError.message);
    }
  }

  /**
   * Get all repositories currently cloned on disk
   */
  static async getAllCloned(): Promise<ClonedRepositoryInfo[]> {
    const mappings = RepositoryMappingService.getAllMappings();
    const clonedRepos: ClonedRepositoryInfo[] = [];

    for (const [key, repoId] of Object.entries(mappings)) {
      if (RepositoryMappingService.repoExists(repoId, REPOS_DIR)) {
        const parsed = RepositoryMappingService.parseKey(key);
        if (parsed) {
          clonedRepos.push({
            repoId,
            repoUrl: parsed.repoUrl,
            branch: parsed.branch,
            repoPath: path.join(REPOS_DIR, repoId)
          });
        }
      }
    }

    return clonedRepos;
  }
}

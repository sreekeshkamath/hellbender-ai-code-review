/**
 * PersistentRepositoryService
 * 
 * This service handles all operations related to persistent repository storage.
 * It manages cloning repositories to persistent storage, syncing changes,
 * and maintaining database records.
 * 
 * Key responsibilities:
 * - Clone repositories to persistent storage
 * - Sync repositories with remote changes
 * - List available branches
 * - Delete repositories from storage and database
 */

import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../database/connection';
import {
  PersistentRepository,
  CreatePersistentRepositoryDTO,
  createPersistentRepository,
  createPersistentRepositoryList,
  isValidRepositoryUrl,
  extractRepositoryName,
} from './PersistentRepository';
import { REPOS_DIR } from '../config/constants';
import { GitErrorParser } from '../utils/GitErrorParser';
import { validateBranchName, validateRepoPath } from '../utils/PathValidator';
import { RepositoryMappingService } from './RepositoryMappingService';

/**
 * Get the persistent storage base path from environment
 */
function getPersistentStoragePath(): string {
  return process.env.PERSISTENT_REPOS_PATH || '/data/repos';
}

/**
 * Ensure the persistent storage directory exists
 */
function ensureStorageDirectory(): void {
  const storagePath = getPersistentStoragePath();
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
}

/**
 * Service class for managing persistent repositories
 */
export class PersistentRepositoryService {
  /**
   * Create a new persistent repository by cloning it to persistent storage
   * 
   * @param url The repository URL to clone
   * @param name Optional custom name for the repository
   * @param branch The branch to clone (defaults to 'main')
   * @param accessToken Optional GitHub access token for private repos
   * @returns Promise<PersistentRepository> The created repository record
   */
  static async create(
    url: string,
    name?: string,
    branch: string = 'main',
    accessToken?: string
  ): Promise<PersistentRepository> {
    // Validate URL
    if (!isValidRepositoryUrl(url)) {
      throw new Error('Please enter a valid Git repository URL (e.g., https://github.com/username/repo)');
    }

    // Validate branch name
    if (!validateBranchName(branch)) {
      throw new Error('Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.');
    }

    const storagePath = getPersistentStoragePath();
    ensureStorageDirectory();

    const repoId = uuidv4();
    const repoStoragePath = path.join(storagePath, repoId);
    const repoName = name || extractRepositoryName(url);

    // Clone the repository
    const git: SimpleGit = simpleGit();

    // Prepare authenticated URL if token is provided
    let authUrl = url;
    if (accessToken && url.includes('github.com')) {
      authUrl = url.replace(/^https:\/\//, `https://oauth2:${accessToken}@`);
    }

    console.log(`Cloning persistent repository: ${url} (${branch}) -> ${repoStoragePath}`);

    try {
      const cloneOptions: string[] = ['--depth', '1', '--branch', branch, '--single-branch'];
      await git.clone(authUrl, repoStoragePath, cloneOptions);
    } catch (error: any) {
      // Clean up on failure
      if (fs.existsSync(repoStoragePath)) {
        fs.rmSync(repoStoragePath, { recursive: true, force: true });
      }
      const parsedError = GitErrorParser.parseSimpleGitError(error, branch);
      throw new Error(parsedError.message);
    }

    // Save to database within a transaction
    const result = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `INSERT INTO persistent_repositories 
         (id, name, url, default_branch, storage_path, last_synced_at, is_active)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, true)
         RETURNING *`,
        [repoId, repoName, url, branch, repoStoragePath]
      );

      return createPersistentRepository(insertResult.rows[0]);
    });

    // Store in repository mapping for quick lookups
    RepositoryMappingService.setRepoId(url, branch, repoId);

    console.log(`Persistent repository created: ${repoName} (${repoId})`);

    return result;
  }

  /**
   * Get all persistent repositories
   * 
   * @param options Optional filters
   * @param options.includeInactive Whether to include inactive repositories
   * @returns Promise<PersistentRepository[]> List of repositories
   */
  static async getAll(options?: { includeInactive?: boolean }): Promise<PersistentRepository[]> {
    const includeInactive = options?.includeInactive ?? false;
    
    let queryText = `
      SELECT * FROM persistent_repositories
    `;
    
    if (!includeInactive) {
      queryText += ' WHERE is_active = true';
    }
    
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText);
    return createPersistentRepositoryList(result.rows);
  }

  /**
   * Get a single persistent repository by ID
   * 
   * @param id The repository UUID
   * @returns Promise<PersistentRepository | null> The repository or null if not found
   */
  static async getById(id: string): Promise<PersistentRepository | null> {
    const result = await query(
      'SELECT * FROM persistent_repositories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return createPersistentRepository(result.rows[0]);
  }

  /**
   * Update a persistent repository
   * 
   * @param id The repository UUID
   * @param updates The fields to update
   * @returns Promise<PersistentRepository | null> The updated repository or null
   */
  static async update(
    id: string,
    updates: { name?: string; defaultBranch?: string }
  ): Promise<PersistentRepository | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.defaultBranch !== undefined) {
      setClauses.push(`default_branch = $${paramIndex++}`);
      values.push(updates.defaultBranch);
    }

    if (setClauses.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE persistent_repositories 
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return createPersistentRepository(result.rows[0]);
  }

  /**
   * Sync a persistent repository with its remote
   * 
   * @param id The repository UUID
   * @param accessToken Optional GitHub access token
   * @returns Promise<PersistentRepository> The updated repository
   */
  static async sync(id: string, accessToken?: string): Promise<PersistentRepository> {
    const repo = await this.getById(id);
    
    if (!repo) {
      throw new Error('Repository not found');
    }

    const repoPath = validateRepoPath(id, getPersistentStoragePath());
    if (!repoPath || !fs.existsSync(repoPath)) {
      throw new Error('Repository storage not found');
    }

    const git: SimpleGit = simpleGit(repoPath);

    // Prepare authenticated URL if token is provided
    let authUrl = repo.url;
    if (accessToken && repo.url.includes('github.com')) {
      authUrl = repo.url.replace(/^https:\/\//, `https://oauth2:${accessToken}@`);
    }

    // Update remote URL if needed
    const remotes = await git.getRemotes(true);
    const originExists = remotes.some((remote) => remote.name === 'origin');
    
    if (originExists) {
      await git.remote(['set-url', 'origin', authUrl]);
    } else {
      await git.addRemote('origin', authUrl);
    }

    // Fetch and reset to the default branch
    try {
      await git.fetch('origin', repo.defaultBranch);
      await git.reset(['--hard', `origin/${repo.defaultBranch}`]);
    } catch (error: any) {
      const parsedError = GitErrorParser.parseSimpleGitError(error, repo.defaultBranch);
      throw new Error(parsedError.message);
    }

    // Update last_synced_at in database
    const result = await query(
      `UPDATE persistent_repositories 
       SET last_synced_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    console.log(`Repository synced: ${repo.name}`);

    return createPersistentRepository(result.rows[0]);
  }

  /**
   * Delete a persistent repository from storage and database
   * 
   * @param id The repository UUID
   * @returns Promise<boolean> True if deleted successfully
   */
  static async delete(id: string): Promise<boolean> {
    const repo = await this.getById(id);
    
    if (!repo) {
      return false;
    }

    // Remove from storage
    const repoPath = validateRepoPath(id, getPersistentStoragePath());
    if (repoPath && fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      console.log(`Repository storage removed: ${repoPath}`);
    }

    // Remove from database (cascades to related records)
    await query('DELETE FROM persistent_repositories WHERE id = $1', [id]);

    // Remove from repository mapping
    RepositoryMappingService.removeMapping(repo.url, repo.defaultBranch);

    console.log(`Repository deleted: ${repo.name}`);

    return true;
  }

  /**
   * Get a list of all branches in a repository
   * 
   * @param id The repository UUID
   * @returns Promise<string[]> List of branch names
   */
  static async getBranches(id: string): Promise<string[]> {
    const repo = await this.getById(id);
    
    if (!repo) {
      throw new Error('Repository not found');
    }

    const repoPath = validateRepoPath(id, getPersistentStoragePath());
    if (!repoPath || !fs.existsSync(repoPath)) {
      throw new Error('Repository storage not found');
    }

    const git: SimpleGit = simpleGit(repoPath);

    // Fetch all branches
    await git.fetch('--all');

    // Get branch list
    const branches = await git.branchLocal();

    return branches.all;
  }

  /**
   * Get the file tree of a repository
   * 
   * @param id The repository UUID
   * @returns Promise<Array<{path: string, size: number}>> List of files
   */
  static async getFiles(id: string): Promise<Array<{ path: string; size: number }>> {
    const repo = await this.getById(id);
    
    if (!repo) {
      throw new Error('Repository not found');
    }

    const repoPath = validateRepoPath(id, getPersistentStoragePath());
    if (!repoPath || !fs.existsSync(repoPath)) {
      throw new Error('Repository storage not found');
    }

    const getAllFiles = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let files: string[] = [];
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(getAllFiles(fullPath));
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
      
      return files;
    };

    const filePaths = getAllFiles(repoPath);
    
    return filePaths.map((filePath) => ({
      path: path.relative(repoPath, filePath),
      size: fs.statSync(filePath).size,
    }));
  }

  /**
   * Check if a repository exists and is active
   * 
   * @param id The repository UUID
   * @returns Promise<boolean> True if repository exists and is active
   */
  static async exists(id: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM persistent_repositories WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows.length > 0;
  }
}

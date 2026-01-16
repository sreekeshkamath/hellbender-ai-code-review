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

    // Use shallow clone for faster cloning
    const { exec } = require('child_process');
    const cloneCommand = `git clone --depth 1 ${branch !== 'main' ? `--branch ${branch} --single-branch` : ''} "${authRepoUrl}" "${repoPath}"`;

    await new Promise((resolve, reject) => {
      exec(cloneCommand, (error: any, stdout: any, stderr: any) => {
        if (error) {
          // Use structured error parser instead of string matching
          const parsedError = GitErrorParser.parseExecError(error, stderr, stdout, branch);
          reject(new Error(parsedError.message));
        } else {
          resolve(stdout);
        }
      });
    });

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
    const repoPath = path.join(REPOS_DIR, repoId);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    if (!repoUrl) {
      throw new Error('Repository URL is required for sync');
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
    const repoPath = path.join(REPOS_DIR, repoId);

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
    const repoPath = path.join(REPOS_DIR, repoId);
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }

  static delete(repoId: string): void {
    const repoPath = path.join(REPOS_DIR, repoId);

    // Remove from mappings
    const mappings = RepositoryMappingService.getAllMappings();
    for (const [key, mappedRepoId] of Object.entries(mappings)) {
      if (mappedRepoId === repoId) {
        const [repoUrl, branch] = key.split(':');
        RepositoryMappingService.removeMapping(repoUrl, branch);
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
}
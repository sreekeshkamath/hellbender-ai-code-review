import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import simpleGit, { SimpleGit } from 'simple-git';
import { FileService } from './FileService';
import { RepositoryMappingService } from './RepositoryMappingService';

export class RepositoryService {
  private static REPOS_DIR = path.join(__dirname, '../../../temp/repos');

  private static isValidRepoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    // Must be a valid Git URL: http://, https://, git@, or git://
    const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
    return gitUrlPattern.test(url.trim());
  }

  static async clone(repoUrl: string, branch: string = 'main', accessToken?: string): Promise<{ repoId: string; repoPath: string; files: { path: string; size: number }[]; cached: boolean }> {
    if (!fs.existsSync(this.REPOS_DIR)) {
      fs.mkdirSync(this.REPOS_DIR, { recursive: true });
    }

    if (!this.isValidRepoUrl(repoUrl)) {
      throw new Error('Please enter a valid Git repository URL (e.g., https://github.com/username/repo)');
    }

    // Check if repository is already cloned
    let repoId = RepositoryMappingService.getRepoId(repoUrl, branch);
    
    if (repoId && RepositoryMappingService.repoExists(repoId, this.REPOS_DIR)) {
      // Repository already exists, return existing data
      const repoPath = path.join(this.REPOS_DIR, repoId);
      const allFiles = FileService.getAllFiles(repoPath);
      const files = allFiles.map(f => ({
        path: path.relative(repoPath, f),
        size: fs.statSync(f).size
      }));
      
      return {
        repoId,
        repoPath,
        files,
        cached: true
      };
    }

    // Repository doesn't exist, clone it
    repoId = uuidv4();
    const repoPath = path.join(this.REPOS_DIR, repoId);
    const git: SimpleGit = simpleGit();

    const authRepoUrl = accessToken 
      ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
      : repoUrl;

    const cloneOptions = branch !== 'main' ? ['--branch', branch, '--single-branch'] : [];
    
    await git.clone(authRepoUrl, repoPath, cloneOptions);

    // Store the mapping
    RepositoryMappingService.setRepoId(repoUrl, branch, repoId);

    const allFiles = FileService.getAllFiles(repoPath);
    const files = allFiles.map(f => ({
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

  static async sync(repoId: string, repoUrl: string, branch: string = 'main', accessToken?: string): Promise<{ repoId: string; repoPath: string; files: { path: string; size: number }[] }> {
    const repoPath = path.join(this.REPOS_DIR, repoId);

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

    await git.fetch('origin', branch || 'main');
    await git.reset(['hard', `origin/${branch || 'main'}`]);

    const allFiles = FileService.getAllFiles(repoPath);
    const files = allFiles.map(f => ({
      path: path.relative(repoPath, f),
      size: fs.statSync(f).size
    }));

    return {
      repoId,
      repoPath,
      files
    };
  }

  static getFiles(repoId: string): { path: string; size: number }[] {
    const repoPath = path.join(this.REPOS_DIR, repoId);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    const allFiles = FileService.getAllFiles(repoPath);
    return allFiles.map(f => ({
      path: path.relative(repoPath, f),
      size: fs.statSync(f).size
    }));
  }

  static readFile(repoId: string, filePath: string): string {
    const repoPath = path.join(this.REPOS_DIR, repoId);
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }

  static delete(repoId: string): void {
    // Remove from mappings
    const mappings = RepositoryMappingService.getAllMappings();
    for (const [key, mappedRepoId] of Object.entries(mappings)) {
      if (mappedRepoId === repoId) {
        const [repoUrl, branch] = key.split(':');
        RepositoryMappingService.removeMapping(repoUrl, branch);
        break;
      }
    }

    const repoPath = path.join(this.REPOS_DIR, repoId);

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR, MAPPINGS_FILE } from '../config/constants';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class RepositoryMappingService {
  private static createKey(repoUrl: string, branch: string = 'main'): string {
    const normalizedUrl = repoUrl.toLowerCase().trim().replace(/\.git$/, '');
    return `${normalizedUrl}:${branch}`;
  }

  /**
   * Parses a mapping key back into repoUrl and branch.
   * Handles URLs with colons (e.g., https://, git@host:path) by splitting on the last colon.
   */
  static parseKey(key: string): { repoUrl: string; branch: string } | null {
    const lastColonIndex = key.lastIndexOf(':');
    if (lastColonIndex === -1) {
      return null;
    }
    return {
      repoUrl: key.substring(0, lastColonIndex),
      branch: key.substring(lastColonIndex + 1)
    };
  }

  private static loadMappings(): Record<string, string> {
    try {
      if (!fs.existsSync(MAPPINGS_FILE)) {
        return {};
      }
      const data = fs.readFileSync(MAPPINGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading repo mappings:', error);
      return {};
    }
  }

  private static saveMappings(mappings: Record<string, string>): void {
    try {
      fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
    } catch (error) {
      console.error('Error saving repo mappings:', error);
    }
  }

  static getRepoId(repoUrl: string, branch: string = 'main'): string | null {
    const mappings = this.loadMappings();
    const key = this.createKey(repoUrl, branch);
    return mappings[key] || null;
  }

  static setRepoId(repoUrl: string, branch: string, repoId: string): void {
    const mappings = this.loadMappings();
    const key = this.createKey(repoUrl, branch);
    mappings[key] = repoId;
    this.saveMappings(mappings);
  }

  static removeMapping(repoUrl: string, branch: string): void {
    const mappings = this.loadMappings();
    const key = this.createKey(repoUrl, branch);
    delete mappings[key];
    this.saveMappings(mappings);
  }

  static getAllMappings(): Record<string, string> {
    return this.loadMappings();
  }

  static repoExists(repoId: string, reposDir: string): boolean {
    const repoPath = path.join(reposDir, repoId);
    return fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'));
  }
}
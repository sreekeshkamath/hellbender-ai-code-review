import * as fs from 'fs';
import * as path from 'path';

export class RepositoryMappingService {
  private static DATA_DIR = path.join(__dirname, '../../data');
  private static MAPPINGS_FILE = path.join(RepositoryMappingService.DATA_DIR, 'repo-mappings.json');

  static createKey(repoUrl: string, branch: string = 'main'): string {
    const normalizedUrl = repoUrl.toLowerCase().trim().replace(/\.git$/, '');
    return `${normalizedUrl}:${branch}`;
  }

  static loadMappings(): Record<string, string> {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
    }
    try {
      if (!fs.existsSync(this.MAPPINGS_FILE)) {
        return {};
      }
      const data = fs.readFileSync(this.MAPPINGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading repo mappings:', error);
      return {};
    }
  }

  static saveMappings(mappings: Record<string, string>): void {
    try {
      fs.writeFileSync(this.MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
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
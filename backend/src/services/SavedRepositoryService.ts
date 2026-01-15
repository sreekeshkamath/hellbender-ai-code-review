import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EncryptionService } from './EncryptionService';
import { SavedRepository } from '../models/SavedRepository';

export class SavedRepositoryService {
  private static DATA_DIR = path.join(__dirname, '../../data');
  private static REPOS_FILE = path.join(SavedRepositoryService.DATA_DIR, 'repos.json.enc');

  static loadRepos(): any[] {
    try {
      if (!fs.existsSync(this.DATA_DIR)) {
        fs.mkdirSync(this.DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(this.REPOS_FILE)) {
        return [];
      }
      const encrypted = fs.readFileSync(this.REPOS_FILE, 'utf8');
      const decrypted = EncryptionService.decrypt(encrypted);
      if (!decrypted) return [];
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error loading repos:', error);
      return [];
    }
  }

  static saveRepos(repos: any[]): void {
    try {
      const encrypted = EncryptionService.encrypt(JSON.stringify(repos));
      fs.writeFileSync(this.REPOS_FILE, encrypted);
    } catch (error) {
      console.error('Error saving repos:', error);
    }
  }

  static getAll(): SavedRepository[] {
    return this.loadRepos().map(repo => ({
      id: repo.id,
      name: repo.name,
      url: repo.url,
      branch: repo.branch,
      lastUsed: repo.lastUsed ? new Date(repo.lastUsed) : new Date(0)
    }));
  }

  static add(repo: { name?: string; url: string; branch?: string; repoId?: string; cloned?: boolean }): SavedRepository {
    const repos = this.loadRepos();
    const newRepo = {
      id: uuidv4(),
      name: repo.name || repo.url.split('/').pop()?.replace('.git', '') || 'Unknown',
      url: repo.url,
      branch: repo.branch || 'main',
      repoId: repo.repoId || null,
      cloned: repo.cloned || false,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    repos.push(newRepo);
    this.saveRepos(repos);
    return {
      id: newRepo.id,
      name: newRepo.name,
      url: newRepo.url,
      branch: newRepo.branch,
      lastUsed: new Date(0)
    };
  }

  static delete(id: string): void {
    const repos = this.loadRepos();
    const filtered = repos.filter(r => r.id !== id);
    this.saveRepos(filtered);
  }

  static update(id: string, updates: Partial<SavedRepository & { updatedAt?: string }>): SavedRepository | null {
    const repos = this.loadRepos();
    const index = repos.findIndex(r => r.id === id);
    if (index !== -1) {
      repos[index] = { ...repos[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveRepos(repos);
      return {
        id: repos[index].id,
        name: repos[index].name,
        url: repos[index].url,
        branch: repos[index].branch,
        lastUsed: repos[index].lastUsed ? new Date(repos[index].lastUsed) : new Date(0)
      };
    }
    return null;
  }

  static touch(id: string): void {
    const repos = this.loadRepos();
    const index = repos.findIndex(r => r.id === id);
    if (index !== -1) {
      repos[index].lastUsed = new Date().toISOString();
      this.saveRepos(repos);
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SavedRepository } from '../models/SavedRepository';
import { EncryptionService } from './EncryptionService';
import { DATA_DIR, REPOS_FILE } from '../config/constants';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class SavedRepositoryService {
  private static loadRepos(): SavedRepository[] {
    try {
      if (!fs.existsSync(REPOS_FILE)) {
        return [];
      }
      const encrypted = fs.readFileSync(REPOS_FILE, 'utf8');
      const decrypted = EncryptionService.decrypt(encrypted);
      if (!decrypted) return [];
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error loading repos:', error);
      return [];
    }
  }

  private static saveRepos(repos: SavedRepository[]): void {
    try {
      const encrypted = EncryptionService.encrypt(JSON.stringify(repos));
      fs.writeFileSync(REPOS_FILE, encrypted);
    } catch (error) {
      console.error('Error saving repos:', error);
    }
  }

  static getAll(): SavedRepository[] {
    return this.loadRepos();
  }

  static add(repo: { name?: string; url: string; branch?: string; repoId?: string | null; cloned?: boolean }): SavedRepository {
    const repos = this.loadRepos();
    const newRepo: SavedRepository = {
      id: uuidv4(),
      name: repo.name || repo.url.split('/').pop()?.replace(/\.git$/, '') || 'Unnamed',
      url: repo.url,
      branch: repo.branch || 'main',
      repoId: repo.repoId || null,
      cloned: repo.cloned || false,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    repos.push(newRepo);
    this.saveRepos(repos);
    return newRepo;
  }

  static delete(id: string): void {
    const repos = this.loadRepos();
    const filtered = repos.filter(r => r.id !== id);
    this.saveRepos(filtered);
  }

  static update(id: string, updates: Partial<SavedRepository>): SavedRepository | null {
    const repos = this.loadRepos();
    const index = repos.findIndex(r => r.id === id);
    if (index !== -1) {
      repos[index] = { ...repos[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveRepos(repos);
      return repos[index];
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
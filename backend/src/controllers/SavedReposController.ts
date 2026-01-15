import { Request, Response } from 'express';
import { SavedRepositoryService } from '../services/SavedRepositoryService';

export class SavedReposController {
  private static isValidRepoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    // Must be a valid Git URL: http://, https://, git@, or git://
    const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
    return gitUrlPattern.test(url.trim());
  }

  static getAll(req: Request, res: Response): void {
    try {
      const repos = SavedRepositoryService.getAll();
      const sortedRepos = repos.sort((a, b) => {
        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        }
        if (a.lastUsed) return -1;
        if (b.lastUsed) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      res.json({ repos: sortedRepos });
    } catch (error) {
      console.error('Error getting repos:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static create(req: Request, res: Response): void {
    try {
      const { url, branch, name, repoId, cloned } = req.body;

      if (!url) {
        res.status(400).json({ error: 'Repository URL is required' });
        return;
      }

      if (!this.isValidRepoUrl(url)) {
        res.status(400).json({ error: 'Please enter a valid Git repository URL (e.g., https://github.com/username/repo)' });
        return;
      }

      const repos = SavedRepositoryService.getAll();
      const existing = repos.find(r => r.url.toLowerCase() === url.toLowerCase() && r.branch === (branch || 'main'));

      if (existing) {
        // Update the existing repo with new repoId and cloned status if provided
        const updates: any = {};
        if (repoId !== undefined) updates.repoId = repoId;
        if (cloned !== undefined) updates.cloned = cloned;
        SavedRepositoryService.update(existing.id, updates);
        SavedRepositoryService.touch(existing.id);
        const updated = SavedRepositoryService.getAll().find(r => r.id === existing.id);
        res.json({ repo: updated, message: 'Repository already saved' });
        return;
      }

      const repo = SavedRepositoryService.add({ url, branch, name, repoId, cloned });
      res.json({ repo, message: 'Repository saved successfully' });
    } catch (error) {
      console.error('Error saving repo:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static delete(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      SavedRepositoryService.delete(id);
      res.json({ success: true, message: 'Repository removed' });
    } catch (error) {
      console.error('Error deleting repo:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static touch(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      SavedRepositoryService.touch(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating repo:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
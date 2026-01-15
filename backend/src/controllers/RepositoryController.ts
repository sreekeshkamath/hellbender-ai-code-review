import { Request, Response } from 'express';
import { RepositoryService } from '../services/RepositoryService';

export class RepositoryController {
  static async clone(req: Request, res: Response): Promise<void> {
    try {
      const { repoUrl, branch } = req.body;
      const result = await RepositoryService.cloneWithDefaults(repoUrl, branch);
      res.json(result);
    } catch (error) {
      console.error('Clone error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async sync(req: Request, res: Response): Promise<void> {
    try {
      const { repoId } = req.params;
      const { repoUrl, branch } = req.body;
      const result = await RepositoryService.syncWithDefaults(repoId, repoUrl, branch);
      res.json(result);
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static getFiles(req: Request, res: Response): void {
    try {
      const { repoId } = req.params;
      const files = RepositoryService.getFiles(repoId);
      res.json({ files });
    } catch (error) {
      console.error('Files error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static getFile(req: Request, res: Response): void {
    try {
      const { repoId, path: filePath } = req.params;
      const content = RepositoryService.getFile(repoId, filePath);
      res.json({ content });
    } catch (error) {
      console.error('Read error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static delete(req: Request, res: Response): void {
    try {
      const { repoId } = req.params;
      RepositoryService.delete(repoId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
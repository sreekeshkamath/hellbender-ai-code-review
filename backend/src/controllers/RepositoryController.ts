import { Request, Response } from 'express';
import { RepositoryService } from '../services/RepositoryService';
import { validateBranchName } from '../utils/PathValidator';

export class RepositoryController {
  static async clone(req: Request, res: Response): Promise<void> {
    try {
      const { repoUrl, branch } = req.body;

      // Validate branch name early to prevent command injection
      if (branch && !validateBranchName(branch)) {
        res.status(400).json({
          error: 'Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
        });
        return;
      }

      const result = await RepositoryService.cloneWithDefaults(repoUrl, branch);
      res.json(result);
    } catch (error) {
      console.error('Clone error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async sync(req: Request, res: Response): Promise<void> {
    try {
      const repoId = req.params.repoId as string;
      const { repoUrl, branch } = req.body;

      // Validate branch name early to prevent command injection
      if (branch && !validateBranchName(branch)) {
        res.status(400).json({
          error: 'Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
        });
        return;
      }

      const result = await RepositoryService.syncWithDefaults(repoId, repoUrl, branch);
      res.json(result);
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static getFiles(req: Request, res: Response): void {
    try {
      const repoId = req.params.repoId as string;
      const files = RepositoryService.getFiles(repoId);
      res.json({ files });
    } catch (error) {
      console.error('Files error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static getFile(req: Request, res: Response): void {
    try {
      const repoId = req.params.repoId as string;
      const filePath = req.params[0];
      const content = RepositoryService.getFile(repoId, filePath);
      res.json({ content });
    } catch (error) {
      console.error('Read error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static delete(req: Request, res: Response): void {
    try {
      const repoId = req.params.repoId as string;
      RepositoryService.delete(repoId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getChangedFiles(req: Request, res: Response): Promise<void> {
    try {
      const repoId = req.params.repoId as string;
      const { targetBranch, currentBranch } = req.query;

      if (!targetBranch || typeof targetBranch !== 'string') {
        res.status(400).json({ error: 'targetBranch query parameter is required' });
        return;
      }

      // Validate branch names early to prevent command injection
      if (!validateBranchName(targetBranch)) {
        res.status(400).json({
          error: 'Invalid target branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
        });
        return;
      }

      if (currentBranch && typeof currentBranch === 'string' && !validateBranchName(currentBranch)) {
        res.status(400).json({
          error: 'Invalid current branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
        });
        return;
      }

      const files = await RepositoryService.getChangedFiles(
        repoId,
        targetBranch,
        typeof currentBranch === 'string' ? currentBranch : undefined
      );
      res.json({ files });
    } catch (error) {
      console.error('Changed files error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getBranches(req: Request, res: Response): Promise<void> {
    try {
      const repoId = req.params.repoId as string;
      const branches = await RepositoryService.getBranches(repoId);
      res.json({ branches });
    } catch (error) {
      console.error('Get branches error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getAllCloned(req: Request, res: Response): Promise<void> {
    try {
      const repos = await RepositoryService.getAllCloned();
      res.json({ repos });
    } catch (error) {
      console.error('Get cloned repos error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

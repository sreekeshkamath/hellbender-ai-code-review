import { Request, Response } from 'express';
import { PullRequestService } from '../services/PullRequestService';
import { DiffService } from '../services/DiffService';

export class PullRequestController {
  static async getAll(req: Request, res: Response) {
    try {
      const { repoId } = req.query;
      const prs = PullRequestService.getAll(repoId as string);
      res.json(prs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const pr = PullRequestService.getById(id);
      if (!pr) {
        return res.status(404).json({ error: 'Pull Request not found' });
      }
      res.json(pr);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const pr = PullRequestService.create(req.body);
      res.status(201).json(pr);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const pr = PullRequestService.updateStatus(id, status);
      if (!pr) {
        return res.status(404).json({ error: 'Pull Request not found' });
      }
      res.json(pr);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getComments(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const comments = PullRequestService.getComments(id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const comment = PullRequestService.addComment(req.body);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getDiff(req: Request, res: Response) {
    try {
      const { repoId, sourceBranch, targetBranch } = req.query;
      if (!repoId || !sourceBranch || !targetBranch) {
        return res.status(400).json({ error: 'repoId, sourceBranch, and targetBranch are required' });
      }
      const diffs = await DiffService.getDiff(
        repoId as string,
        sourceBranch as string,
        targetBranch as string
      );
      res.json(diffs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getCommits(req: Request, res: Response) {
    try {
      const { repoId, sourceBranch, targetBranch } = req.query;
      if (!repoId || !sourceBranch || !targetBranch) {
        return res.status(400).json({ error: 'repoId, sourceBranch, and targetBranch are required' });
      }
      const commits = await DiffService.getCommits(
        repoId as string,
        sourceBranch as string,
        targetBranch as string
      );
      res.json(commits);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

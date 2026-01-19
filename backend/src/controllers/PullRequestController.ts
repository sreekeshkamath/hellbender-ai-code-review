import { Request, Response } from 'express';
import { PullRequestService } from '../services/PullRequestService';
import { DiffService } from '../services/DiffService';
import { AnalysisService } from '../services/AnalysisService';
import { validateRepoPath, validateFilePath } from '../utils/PathValidator';
import { REPOS_DIR } from '../config/constants';
import * as path from 'path';
import * as fs from 'fs';

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

  static async requestAIReview(req: Request, res: Response) {
    try {
      const prId = req.params.id as string;
      const { model } = req.body;

      if (!model) {
        return res.status(400).json({ error: 'Model is required' });
      }

      // Get the PR
      const pr = PullRequestService.getById(prId);
      if (!pr) {
        return res.status(404).json({ error: 'Pull Request not found' });
      }

      // Validate repoId
      const repoPath = validateRepoPath(pr.repoId, REPOS_DIR);
      if (!repoPath) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      if (!fs.existsSync(repoPath)) {
        return res.status(400).json({ error: 'Repository not found' });
      }

      // Get diff to find changed files
      const diffs = await DiffService.getDiff(
        pr.repoId,
        pr.sourceBranch,
        pr.targetBranch
      );

      if (diffs.length === 0) {
        return res.json({ message: 'No changes to review', commentsCreated: 0 });
      }

      // Analyze each changed file and convert issues to comments
      const CONCURRENCY_LIMIT = 3;
      let commentsCreated = 0;

      for (let i = 0; i < diffs.length; i += CONCURRENCY_LIMIT) {
        const batch = diffs.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (fileDiff) => {
          try {
            // Validate file path
            const validatedPath = validateFilePath(fileDiff.filePath, repoPath);
            if (!validatedPath) {
              console.warn(`Invalid file path: ${fileDiff.filePath}`);
              return;
            }

            const fullPath = path.join(repoPath, validatedPath);
            if (!fs.existsSync(fullPath)) {
              console.warn(`File not found: ${fileDiff.filePath}`);
              return;
            }

            // Read file content
            const content = fs.readFileSync(fullPath, 'utf-8');

            // Analyze the file
            console.log(`Analyzing ${fileDiff.filePath} for PR ${prId}...`);
            const analysis = await AnalysisService.analyzeCode(
              content,
              fileDiff.filePath,
              model
            );

            // Convert issues to comments
            if (analysis.issues && analysis.issues.length > 0) {
              for (const issue of analysis.issues) {
                // Only create comments for issues with line numbers
                if (issue.line !== undefined && issue.line !== null) {
                  const commentContent = `${issue.message}\n\n**Suggestion:** ${issue.suggestion}\n\n**Code:**\n\`\`\`\n${issue.code}\n\`\`\``;

                  PullRequestService.addComment({
                    prId,
                    author: 'HELLBENDER_AI',
                    content: commentContent,
                    filePath: fileDiff.filePath,
                    line: issue.line,
                    type: 'ai',
                    severity: issue.severity as 'low' | 'medium' | 'high' | 'critical'
                  });
                  commentsCreated++;
                }
              }
            }

            // Also convert vulnerabilities to comments
            if (analysis.vulnerabilities && analysis.vulnerabilities.length > 0) {
              for (const vuln of analysis.vulnerabilities) {
                if (vuln.line !== undefined && vuln.line !== null) {
                  const commentContent = `Security vulnerability detected: ${vuln.type}\n\n**Code:**\n\`\`\`\n${vuln.code}\n\`\`\``;

                  PullRequestService.addComment({
                    prId,
                    author: 'HELLBENDER_AI',
                    content: commentContent,
                    filePath: fileDiff.filePath,
                    line: vuln.line,
                    type: 'ai',
                    severity: (vuln.severity as 'low' | 'medium' | 'high' | 'critical') || 'high'
                  });
                  commentsCreated++;
                }
              }
            }
          } catch (error) {
            console.error(`Error analyzing ${fileDiff.filePath}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
      }

      res.json({
        message: 'AI review completed',
        commentsCreated,
        filesAnalyzed: diffs.length
      });
    } catch (error) {
      console.error('AI review error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

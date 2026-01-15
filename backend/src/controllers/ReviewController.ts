import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AnalysisService } from '../services/AnalysisService';
import { AnalysisResult, AnalysisSummary } from '../models/AnalysisResult';
import { REPOS_DIR } from '../config/constants';

const MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
];

export class ReviewController {
  static getModels(req: Request, res: Response): void {
    res.json(MODELS);
  }

  static async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { repoId, model, files } = req.body;

      if (!repoId || !model || !files || files.length === 0) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const repoPath = path.join(REPOS_DIR, repoId);

      if (!fs.existsSync(repoPath)) {
        res.status(400).json({ error: 'Repository not found' });
        return;
      }

      const results: AnalysisResult[] = [];

      for (const file of files) {
        const filePath = path.join(repoPath, file.path);

        if (!fs.existsSync(filePath)) {
          results.push({
            file: file.path,
            error: 'File not found'
          });
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const analysis = await AnalysisService.analyzeCode(content, file.path, model);

        results.push({
          file: file.path,
          ...analysis
        });
      }

      const overallScore = ReviewController.calculateOverallScore(results);
      const vulnerabilityCount = ReviewController.countVulnerabilities(results);

      const response = {
        results,
        summary: {
          overallScore,
          totalFiles: results.length,
          vulnerabilityCount,
          reviewedAt: new Date().toISOString()
        } as AnalysisSummary
      };

      res.json(response);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  private static calculateOverallScore(results: AnalysisResult[]): number {
    const scores = results
      .filter(r => r.score !== undefined)
      .map(r => r.score!);

    if (scores.length === 0) return 100;

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avgScore);
  }

  private static countVulnerabilities(results: AnalysisResult[]): number {
    return results.reduce((count, result) => {
      return count + (result.vulnerabilities ? result.vulnerabilities.length : 0);
    }, 0);
  }
}
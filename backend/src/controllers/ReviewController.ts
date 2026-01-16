import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AnalysisService } from '../services/AnalysisService';
import { AnalysisResult, AnalysisSummary } from '../models/AnalysisResult';
import { REPOS_DIR } from '../config/constants';
import { FileInfo } from '../models/FileInfo';

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
      const { repoId, model, files }: { repoId: string, model: string, files: FileInfo[] } = req.body;

      if (!repoId || !model || !files || files.length === 0) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      console.log(`Starting analysis: ${files.length} files, model: ${model}`);

      const repoPath = path.join(REPOS_DIR, repoId);

      if (!fs.existsSync(repoPath)) {
        res.status(400).json({ error: 'Repository not found' });
        return;
      }

      // Process files in parallel with concurrency limit to avoid rate limiting
      const CONCURRENCY_LIMIT = 3; // Process 3 files at a time
      const results: AnalysisResult[] = [];

      // Helper function to analyze a single file
      const analyzeFile = async (file: FileInfo, index: number): Promise<AnalysisResult> => {
        const filePath = path.join(repoPath, file.path);

        if (!fs.existsSync(filePath)) {
          console.warn(`File not found: ${file.path}`);
          return {
            file: file.path,
            error: 'File not found'
          };
        }

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          console.log(`[${index + 1}/${files.length}] Analyzing: ${file.path} (${content.length} chars)`);
          const analysis = await AnalysisService.analyzeCode(content, file.path, model);
          console.log(`[${index + 1}/${files.length}] ✓ Complete: ${file.path}`);

          return {
            file: file.path,
            ...analysis
          };
        } catch (fileError) {
          console.error(`[${index + 1}/${files.length}] ✗ Error analyzing ${file.path}:`, fileError);
          return {
            file: file.path,
            error: (fileError as Error).message
          };
        }
      };

      // Process files in batches with concurrency limit
      for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
        const batch = files.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map((file: FileInfo, batchIndex: number) => 
          analyzeFile(file, i + batchIndex)
        );

        console.log(`Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} (${batch.length} files in parallel)...`);
        
        // Use allSettled so one failure doesn't stop others
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            const file = batch[batchIndex];
            console.error(`Failed to process ${file.path}:`, result.reason);
            results.push({
              file: file.path,
              error: result.reason?.message || 'Unknown error'
            });
          }
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
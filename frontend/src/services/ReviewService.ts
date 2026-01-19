import { ApiClient } from './ApiClient';
import { Model, AnalysisResponse, FileInfo } from '../types/api.types';

export class ReviewService extends ApiClient {
  async getModels(): Promise<Model[]> {
    return this.get<Model[]>('/api/review/models');
  }

  async analyze(repoId: string, model: string, files: FileInfo[]): Promise<AnalysisResponse> {
    // Analysis processes files in parallel (3 at a time), so it's much faster than sequential
    // Calculate timeout: ~2 minutes per batch, with a reasonable max
    // Example: 10 files = 4 batches = 8 minutes max, but typically completes in 2-4 minutes
    const batches = Math.ceil(files.length / 3);
    const timeout = Math.min(batches * 120000, 600000); // Max 10 minutes
    return this.post<AnalysisResponse>('/api/review/analyze', { repoId, model, files }, timeout);
  }
}
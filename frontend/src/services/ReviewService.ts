import { ApiClient } from './ApiClient';
import { Model, AnalysisResponse, FileInfo } from '../types/api.types';

export class ReviewService extends ApiClient {
  async getModels(): Promise<Model[]> {
    return this.get<Model[]>('/api/review/models');
  }

  async analyze(repoId: string, model: string, files: FileInfo[]): Promise<AnalysisResponse> {
    return this.post<AnalysisResponse>('/api/review/analyze', { repoId, model, files });
  }
}
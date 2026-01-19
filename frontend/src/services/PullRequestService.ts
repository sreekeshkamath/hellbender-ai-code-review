import { ApiClient } from './ApiClient';
import { PullRequest, Comment, FileDiff, Commit } from '../types/api.types';

export class PullRequestService extends ApiClient {
  async getAll(repoId?: string): Promise<PullRequest[]> {
    const params = repoId ? { repoId } : undefined;
    return this.get<PullRequest[]>('/api/pull-requests', params);
  }

  async getById(id: string): Promise<PullRequest> {
    return this.get<PullRequest>(`/api/pull-requests/${id}`);
  }

  async create(data: Partial<PullRequest>): Promise<PullRequest> {
    return this.post<PullRequest>('/api/pull-requests', data);
  }

  async updateStatus(id: string, status: 'open' | 'merged' | 'closed'): Promise<PullRequest> {
    return this.patch<PullRequest>(`/api/pull-requests/${id}/status`, { status });
  }

  async getComments(prId: string): Promise<Comment[]> {
    return this.get<Comment[]>(`/api/pull-requests/${prId}/comments`);
  }

  async addComment(prId: string, data: Partial<Comment>): Promise<Comment> {
    return this.post<Comment>(`/api/pull-requests/${prId}/comments`, data);
  }

  async getDiff(repoId: string, sourceBranch: string, targetBranch: string): Promise<FileDiff[]> {
    // Note: This endpoint needs to be added to the backend routes
    // For now, we'll use a placeholder endpoint
    const params = { repoId, sourceBranch, targetBranch };
    return this.get<FileDiff[]>('/api/pull-requests/diff', params);
  }

  async getCommits(repoId: string, sourceBranch: string, targetBranch: string): Promise<Commit[]> {
    const params = { repoId, sourceBranch, targetBranch };
    return this.get<Commit[]>('/api/pull-requests/commits', params);
  }
}

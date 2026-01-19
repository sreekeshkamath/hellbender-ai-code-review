import { ApiClient } from './ApiClient';
import { Repository, FileInfo } from '../types/api.types';

export class RepositoryService extends ApiClient {
  async clone(repoUrl: string, branch?: string): Promise<Repository> {
    return this.post<Repository>('/api/repo/clone', { repoUrl, branch });
  }

  async sync(repoId: string, repoUrl: string, branch?: string): Promise<Repository> {
    return this.post<Repository>(`/api/repo/sync/${repoId}`, { repoUrl, branch });
  }

  async getFiles(repoId: string): Promise<{ files: FileInfo[] }> {
    return this.get<{ files: FileInfo[] }>(`/api/repo/files/${repoId}`);
  }

  async getFile(repoId: string, filePath: string): Promise<{ content: string }> {
    // Note: This endpoint may not be implemented yet
    return this.get<{ content: string }>(`/api/repo/file/${repoId}/${filePath}`);
  }

  async deleteRepo(repoId: string): Promise<{ success: boolean }> {
    return this.delete(`/api/repo/${repoId}`);
  }

  async getChangedFiles(repoId: string, targetBranch: string, currentBranch?: string): Promise<{ files: FileInfo[] }> {
    const params = new URLSearchParams({ targetBranch });
    if (currentBranch) {
      params.append('currentBranch', currentBranch);
    }
    return this.get<{ files: FileInfo[] }>(`/api/repo/changed-files/${repoId}?${params.toString()}`);
  }

  async getBranches(repoId: string): Promise<{ branches: string[] }> {
    return this.get<{ branches: string[] }>(`/api/repo/branches/${repoId}`);
  }

  async getAllCloned(): Promise<{ repos: Array<{ repoId: string; repoUrl: string; branch: string }> }> {
    return this.get<{ repos: Array<{ repoId: string; repoUrl: string; branch: string }> }>('/api/repo/cloned');
  }
}

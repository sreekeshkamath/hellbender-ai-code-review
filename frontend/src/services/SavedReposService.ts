import { ApiClient } from './ApiClient';
import { SavedRepository, SavedReposResponse } from '../types/api.types';

export class SavedReposService extends ApiClient {
  async getAll(): Promise<SavedRepository[]> {
    const response = await this.get<SavedReposResponse>('/api/saved-repos');
    return response.repos;
  }

  async create(data: { url: string; branch?: string; name?: string; repoId?: string | null; cloned?: boolean }): Promise<{ repo: SavedRepository; message: string }> {
    return this.post('/api/saved-repos', data);
  }

  async deleteRepo(id: string): Promise<{ success: boolean; message: string }> {
    return this.delete(`/api/saved-repos/${id}`);
  }

  async touch(id: string): Promise<{ success: boolean }> {
    return this.put(`/api/saved-repos/${id}/touch`, {});
  }
}
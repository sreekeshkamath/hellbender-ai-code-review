/**
 * Persistent Repository Service
 * 
 * This service handles API calls for persistent repository operations.
 * It extends the base ApiClient with methods for managing repositories.
 */

import { ApiClient } from './api';
import {
  PersistentRepository,
  CreatePersistentRepositoryRequest,
  ApiResponse,
  BranchInfo,
} from '../types/reviewSession.types';

/**
 * Get the base API URL
 */
function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

/**
 * PersistentRepositoryService class
 * Provides methods for managing persistent repositories
 */
export const PersistentRepoService = {
  /**
   * Create a new persistent repository
   */
  async create(data: CreatePersistentRepositoryRequest): Promise<PersistentRepository> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create repository');
    }

    const result: ApiResponse<PersistentRepository> = await response.json();
    return result.data;
  },

  /**
   * Get all persistent repositories
   */
  async getAll(includeInactive = false): Promise<PersistentRepository[]> {
    const url = new URL(`${getBaseUrl()}/api/persistent-repos`);
    url.searchParams.set('includeInactive', String(includeInactive));

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch repositories');
    }

    const result: ApiResponse<PersistentRepository[]> = await response.json();
    return result.data;
  },

  /**
   * Get a single repository by ID
   */
  async getById(id: string): Promise<PersistentRepository> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch repository');
    }

    const result: ApiResponse<PersistentRepository> = await response.json();
    return result.data;
  },

  /**
   * Update a repository
   */
  async update(
    id: string,
    data: Partial<{ name: string; defaultBranch: string }>
  ): Promise<PersistentRepository> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update repository');
    }

    const result: ApiResponse<PersistentRepository> = await response.json();
    return result.data;
  },

  /**
   * Sync a repository with its remote
   */
  async sync(id: string): Promise<PersistentRepository> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos/${id}/sync`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync repository');
    }

    const result: ApiResponse<PersistentRepository> = await response.json();
    return result.data;
  },

  /**
   * Delete a repository
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete repository');
    }
  },

  /**
   * Get branches for a repository
   */
  async getBranches(id: string): Promise<BranchInfo[]> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos/${id}/branches`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch branches');
    }

    const result: ApiResponse<string[]> = await response.json();
    return result.data.map((name) => ({
      name,
      isDefault: false,
    }));
  },

  /**
   * Get files for a repository
   */
  async getFiles(id: string): Promise<Array<{ path: string; size: number }>> {
    const response = await fetch(`${getBaseUrl()}/api/persistent-repos/${id}/files`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch files');
    }

    const result: ApiResponse<Array<{ path: string; size: number }>> = await response.json();
    return result.data;
  },
};

export default PersistentRepoService;

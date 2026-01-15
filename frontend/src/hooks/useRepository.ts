import { useState, useCallback } from 'react';
import { RepositoryState } from '../types/models.types';
import { RepositoryService } from '../services/RepositoryService';

export function useRepository() {
  const [state, setState] = useState<RepositoryState>({
    repoId: null,
    repoPath: null,
    files: [],
    isLoading: false,
    error: null,
  });

  const clone = useCallback(async (repoUrl: string, branch?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const repositoryService = new RepositoryService();
      const result = await repositoryService.clone(repoUrl, branch);
      setState({
        repoId: result.repoId,
        repoPath: result.repoPath,
        files: result.files,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, []);

  const sync = useCallback(async (repoUrl: string, branch?: string) => {
    if (!state.repoId) throw new Error('No repository loaded');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const repositoryService = new RepositoryService();
      const result = await repositoryService.sync(state.repoId, repoUrl, branch);
      setState({
        repoId: result.repoId,
        repoPath: result.repoPath,
        files: result.files,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, [state.repoId]);

  const getFiles = useCallback(async () => {
    if (!state.repoId) throw new Error('No repository loaded');
    try {
      const repositoryService = new RepositoryService();
      const result = await repositoryService.getFiles(state.repoId);
      setState(prev => ({ ...prev, files: result.files }));
      return result.files;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, [state.repoId]);

  const clear = useCallback(() => {
    setState({
      repoId: null,
      repoPath: null,
      files: [],
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    clone,
    sync,
    getFiles,
    clear,
  };
}
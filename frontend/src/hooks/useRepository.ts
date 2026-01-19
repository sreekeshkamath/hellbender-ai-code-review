import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { RepositoryState } from '../types/models.types';
import { Repository, FileInfo } from '../types/api.types';
import { RepositoryService } from '../services/RepositoryService';

interface RepositoryContextValue extends RepositoryState {
  clone: (repoUrl: string, branch?: string) => Promise<Repository>;
  sync: (repoUrl: string, branch?: string) => Promise<Repository>;
  getFiles: () => Promise<Repository['files']>;
  getChangedFiles: (targetBranch: string, currentBranch?: string) => Promise<FileInfo[]>;
  clear: () => void;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
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

  const getChangedFiles = useCallback(async (targetBranch: string, currentBranch?: string) => {
    if (!state.repoId) throw new Error('No repository loaded');
    try {
      const repositoryService = new RepositoryService();
      const result = await repositoryService.getChangedFiles(state.repoId, targetBranch, currentBranch);
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

  const value = useMemo<RepositoryContextValue>(() => ({
    ...state,
    clone,
    sync,
    getFiles,
    getChangedFiles,
    clear,
  }), [state, clone, sync, getFiles, getChangedFiles, clear]);

  return React.createElement(RepositoryContext.Provider, { value }, children);
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
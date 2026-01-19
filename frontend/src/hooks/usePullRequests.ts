import { useState, useCallback, useEffect } from 'react';
import { PullRequest } from '../types/api.types';
import { PullRequestService } from '../services/PullRequestService';

interface UsePullRequestsReturn {
  pullRequests: PullRequest[];
  selectedPR: PullRequest | null;
  isLoading: boolean;
  error: string | null;
  fetchPRs: (repoId?: string) => Promise<void>;
  selectPR: (pr: PullRequest | null) => void;
  refreshPR: (id: string) => Promise<void>;
  updatePRStatus: (id: string, status: 'open' | 'merged' | 'closed') => Promise<void>;
}

export function usePullRequests(repoId?: string): UsePullRequestsReturn {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new PullRequestService();

  const fetchPRs = useCallback(async (filterRepoId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const prs = await service.getAll(filterRepoId || repoId);
      setPullRequests(prs);
    } catch (err) {
      setError((err as Error).message);
      setPullRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  const selectPR = useCallback((pr: PullRequest | null) => {
    setSelectedPR(pr);
  }, []);

  const refreshPR = useCallback(async (id: string) => {
    try {
      const pr = await service.getById(id);
      setPullRequests(prev => prev.map(p => p.id === id ? pr : p));
      if (selectedPR?.id === id) {
        setSelectedPR(pr);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [selectedPR]);

  const updatePRStatus = useCallback(async (id: string, status: 'open' | 'merged' | 'closed') => {
    try {
      const updated = await service.updateStatus(id, status);
      setPullRequests(prev => prev.map(p => p.id === id ? updated : p));
      if (selectedPR?.id === id) {
        setSelectedPR(updated);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [selectedPR]);

  // Auto-fetch on mount if repoId is provided
  useEffect(() => {
    if (repoId) {
      fetchPRs();
    }
  }, [repoId, fetchPRs]);

  return {
    pullRequests,
    selectedPR,
    isLoading,
    error,
    fetchPRs,
    selectPR,
    refreshPR,
    updatePRStatus,
  };
}

import { useState, useCallback } from 'react';
import { FileDiff } from '../types/api.types';
import { PullRequestService } from '../services/PullRequestService';

interface UseDiffReturn {
  diff: FileDiff[] | null;
  isLoading: boolean;
  error: string | null;
  fetchDiff: (repoId: string, sourceBranch: string, targetBranch: string) => Promise<void>;
  clearDiff: () => void;
}

export function useDiff(): UseDiffReturn {
  const [diff, setDiff] = useState<FileDiff[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new PullRequestService();

  const fetchDiff = useCallback(async (
    repoId: string,
    sourceBranch: string,
    targetBranch: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const diffs = await service.getDiff(repoId, sourceBranch, targetBranch);
      setDiff(diffs);
    } catch (err) {
      setError((err as Error).message);
      setDiff(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearDiff = useCallback(() => {
    setDiff(null);
    setError(null);
  }, []);

  return {
    diff,
    isLoading,
    error,
    fetchDiff,
    clearDiff,
  };
}

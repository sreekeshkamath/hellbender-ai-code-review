import { useState, useCallback } from 'react';
import { AnalysisState } from '../types/models.types';
import { FileInfo } from '../types/api.types';
import { ReviewService } from '../services/ReviewService';

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    results: [],
    selectedModel: '',
    error: null,
  });

  const analyze = useCallback(async (repoId: string, model: string, files: FileInfo[]) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const reviewService = new ReviewService();
      const result = await reviewService.analyze(repoId, model, files);
      setState({
        isAnalyzing: false,
        results: result.results,
        selectedModel: model,
        error: null,
      });
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, []);

  const clearResults = useCallback(() => {
    setState({
      isAnalyzing: false,
      results: [],
      selectedModel: '',
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    clearResults,
  };
}
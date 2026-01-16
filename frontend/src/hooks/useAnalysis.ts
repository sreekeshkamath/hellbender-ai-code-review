import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnalysisState } from '../types/models.types';
import { FileInfo } from '../types/api.types';
import { ReviewService } from '../services/ReviewService';

interface AnalysisContextValue extends AnalysisState {
  analyze: (repoId: string, model: string, files: FileInfo[], onProgress?: (message: string) => void) => Promise<unknown>;
  clearResults: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    results: [],
    selectedModel: '',
    error: null,
  });

  const analyze = useCallback(async (
    repoId: string, 
    model: string, 
    files: FileInfo[], 
    onProgress?: (message: string) => void
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      // Log initial analysis info
      if (onProgress) {
        onProgress(`Initializing analysis: ${files.length} file(s) selected`);
        onProgress(`Model: ${model}`);
        onProgress(`Repository ID: ${repoId.substring(0, 8)}...`);
        
        // Log file details
        files.forEach((file, index) => {
          const sizeKB = (file.size / 1024).toFixed(1);
          onProgress(`[${index + 1}/${files.length}] Queued: ${file.path} (${sizeKB} KB)`);
        });
        
        // Calculate batches
        const batches = Math.ceil(files.length / 3);
        onProgress(`Processing in ${batches} batch(es) with 3 files per batch`);
        onProgress(`Sending files to AI agent for analysis...`);
      }

      const reviewService = new ReviewService();
      const result = await reviewService.analyze(repoId, model, files);
      
      // Log detailed results
      if (onProgress) {
        onProgress(`───────────────────────────────────────────────────────`);
        const successful = result.results.filter(r => !r.error).length;
        const failed = result.results.filter(r => r.error).length;
        
        onProgress(`Analysis Results Summary:`);
        onProgress(`  ✓ Successful: ${successful} file(s)`);
        if (failed > 0) {
          onProgress(`  ✗ Failed: ${failed} file(s)`);
        }
        
        // Log each file result
        result.results.forEach((fileResult, index) => {
          if (fileResult.error) {
            onProgress(`  [${index + 1}] ✗ ${fileResult.file}: ${fileResult.error}`);
          } else {
            const score = fileResult.score !== undefined ? fileResult.score : 'N/A';
            const issues = fileResult.issues?.length || 0;
            const vulns = fileResult.vulnerabilities?.length || 0;
            onProgress(`  [${index + 1}] ✓ ${fileResult.file}: Score ${score}/100, ${issues} issues, ${vulns} vulnerabilities`);
          }
        });
        
        if (result.summary) {
          onProgress(`═══════════════════════════════════════════════════════`);
          onProgress(`Overall Score: ${result.summary.overallScore}/100`);
          onProgress(`Total Vulnerabilities: ${result.summary.vulnerabilityCount}`);
          onProgress(`Files Analyzed: ${result.summary.totalFiles}`);
          onProgress(`═══════════════════════════════════════════════════════`);
        }
      }

      setState({
        isAnalyzing: false,
        results: result.results,
        selectedModel: model,
        error: null,
      });
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (onProgress) {
        onProgress(`═══════════════════════════════════════════════════════`);
        onProgress(`ANALYSIS ERROR`);
        onProgress(`───────────────────────────────────────────────────────`);
        onProgress(`Error: ${errorMessage}`);
        onProgress(`═══════════════════════════════════════════════════════`);
      }
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
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

  const value = useMemo<AnalysisContextValue>(() => ({
    ...state,
    analyze,
    clearResults,
  }), [state, analyze, clearResults]);

  return React.createElement(AnalysisContext.Provider, { value }, children);
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
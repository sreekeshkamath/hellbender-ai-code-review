/**
 * useReviewSession Hook
 * 
 * This hook manages review session state and provides methods for
 * creating, loading, and analyzing review sessions.
 */

import { useState, useCallback } from 'react';
import { ReviewSessionService } from '../services/ReviewSessionService';
import {
  ReviewSession,
  CreateReviewSessionRequest,
  ReviewSessionStatus,
} from '../types/reviewSession.types';

interface useReviewSessionReturn {
  // State
  sessions: ReviewSession[];
  currentSession: ReviewSession | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  
  // Methods
  createSession: (data: CreateReviewSessionRequest) => Promise<ReviewSession>;
  loadSession: (id: string) => Promise<ReviewSession | null>;
  runAnalysis: (id: string, modelId?: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  loadSessionsByRepository: (repositoryId: string) => Promise<void>;
  clearCurrentSession: () => void;
  clearError: () => void;
}

export function useReviewSession(): useReviewSessionReturn {
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ReviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new review session
   */
  const createSession = useCallback(async (data: CreateReviewSessionRequest): Promise<ReviewSession> => {
    try {
      setError(null);
      setIsLoading(true);
      const session = await ReviewSessionService.create(data);
      setSessions((prev) => [session, ...prev]);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load a single session by ID
   */
  const loadSession = useCallback(async (id: string): Promise<ReviewSession | null> => {
    try {
      setError(null);
      setIsLoading(true);
      const session = await ReviewSessionService.getById(id);
      setCurrentSession(session);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Run analysis on a session
   */
  const runAnalysis = useCallback(async (id: string, modelId?: string): Promise<void> => {
    try {
      setError(null);
      setIsAnalyzing(true);
      
      // Update current session status
      if (currentSession?.id === id) {
        setCurrentSession((prev) => prev ? { ...prev, status: 'in_progress' as ReviewSessionStatus } : null);
      }
      
      const updatedSession = await ReviewSessionService.runAnalysis(id, modelId);
      
      // Update state
      setCurrentSession(updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? updatedSession : s))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run analysis';
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentSession]);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await ReviewSessionService.delete(id);
      
      setSessions((prev) => prev.filter((s) => s.id !== id));
      
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      setError(message);
      throw err;
    }
  }, [currentSession]);

  /**
   * Load all sessions for a repository
   */
  const loadSessionsByRepository = useCallback(async (repositoryId: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      const repositorySessions = await ReviewSessionService.getAll(repositoryId);
      setSessions(repositorySessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current session
   */
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    isAnalyzing,
    error,
    createSession,
    loadSession,
    runAnalysis,
    deleteSession,
    loadSessionsByRepository,
    clearCurrentSession,
    clearError,
  };
}

export default useReviewSession;

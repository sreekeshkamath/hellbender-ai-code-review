/**
 * Review Session Service
 * 
 * This service handles API calls for review session operations.
 * It provides methods for creating, managing, and analyzing branch reviews.
 */

import {
  ReviewSession,
  CreateReviewSessionRequest,
  ApiResponse,
  ReviewFile,
  ReviewComment,
} from '../types/reviewSession.types';

/**
 * Get the base API URL
 */
function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

/**
 * ReviewSessionService class
 * Provides methods for managing review sessions
 */
export const ReviewSessionService = {
  /**
   * Create a new review session
   */
  async create(data: CreateReviewSessionRequest): Promise<ReviewSession> {
    const response = await fetch(`${getBaseUrl()}/api/review-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review session');
    }

    const result: ApiResponse<ReviewSession> = await response.json();
    return result.data;
  },

  /**
   * Get all review sessions, optionally filtered by repository
   */
  async getAll(repositoryId?: string): Promise<ReviewSession[]> {
    const url = new URL(`${getBaseUrl()}/api/review-sessions`);
    if (repositoryId) {
      url.searchParams.set('repositoryId', repositoryId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch review sessions');
    }

    const result: ApiResponse<ReviewSession[]> = await response.json();
    return result.data;
  },

  /**
   * Get a single review session with files and comments
   */
  async getById(id: string): Promise<ReviewSession> {
    const response = await fetch(`${getBaseUrl()}/api/review-sessions/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Review session not found');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch review session');
    }

    const result: ApiResponse<ReviewSession> = await response.json();
    return result.data;
  },

  /**
   * Run AI analysis on a review session
   */
  async runAnalysis(id: string, modelId?: string): Promise<ReviewSession> {
    const response = await fetch(`${getBaseUrl()}/api/review-sessions/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run analysis');
    }

    const result: ApiResponse<ReviewSession> = await response.json();
    return result.data;
  },

  /**
   * Delete a review session
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${getBaseUrl()}/api/review-sessions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete review session');
    }
  },

  /**
   * Poll for review session status until analysis is complete
   */
  async waitForAnalysis(
    id: string,
    onProgress?: (session: ReviewSession) => void,
    maxAttempts = 60,
    interval = 2000
  ): Promise<ReviewSession> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const session = await this.getById(id);
      
      if (onProgress) {
        onProgress(session);
      }

      if (session.status === 'completed' || session.status === 'failed') {
        return session;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    }

    throw new Error('Analysis timed out');
  },

  /**
   * Get comments for a specific file in a review session
   */
  async getFileComments(
    sessionId: string,
    fileId: string
  ): Promise<ReviewComment[]> {
    const session = await this.getById(sessionId);
    const file = session.files?.find((f) => f.id === fileId);
    return file?.comments || [];
  },

  /**
   * Calculate statistics for a review session
   */
  getStatistics(session: ReviewSession): {
    totalFiles: number;
    totalComments: number;
    averageScore: number;
    commentsBySeverity: Record<string, number>;
    commentsByType: Record<string, number>;
  } {
    const files = session.files || [];
    const allComments = files.flatMap((f) => f.comments || []);
    
    const commentsBySeverity: Record<string, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    
    const commentsByType: Record<string, number> = {
      issue: 0,
      suggestion: 0,
      praise: 0,
      question: 0,
      todo: 0,
    };

    allComments.forEach((comment) => {
      commentsBySeverity[comment.severity]++;
      commentsByType[comment.commentType]++;
    });

    const filesWithScores = files.filter((f) => f.score !== null);
    const averageScore = filesWithScores.length > 0
      ? Math.round(
          filesWithScores.reduce((sum, f) => sum + (f.score || 0), 0) /
            filesWithScores.length
        )
      : session.overallScore || 0;

    return {
      totalFiles: files.length,
      totalComments: allComments.length,
      averageScore,
      commentsBySeverity,
      commentsByType,
    };
  },
};

export default ReviewSessionService;

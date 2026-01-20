/**
 * ReviewSessionController
 * 
 * This controller handles HTTP requests for review session operations.
 * It provides REST API endpoints for creating, managing, and analyzing
 * branch comparison reviews.
 */

import { Request, Response, NextFunction } from 'express';
import { ReviewSessionService } from '../services/ReviewSessionService';

/**
 * Request body for creating a review session
 */
interface CreateReviewSessionRequest {
  repositoryId: string;
  name?: string;
  sourceBranch: string;
  targetBranch: string;
  modelId?: string;
}

/**
 * Request body for running analysis
 */
interface RunAnalysisRequest {
  modelId?: string;
}

/**
 * Parse and validate the create review session request
 */
function parseCreateRequest(req: Request): CreateReviewSessionRequest {
  const { repositoryId, name, sourceBranch, targetBranch, modelId } = req.body;
  
  if (!repositoryId) {
    throw new Error('Repository ID is required');
  }
  
  if (!sourceBranch) {
    throw new Error('Source branch is required');
  }
  
  if (!targetBranch) {
    throw new Error('Target branch is required');
  }
  
  return {
    repositoryId: repositoryId.trim(),
    name: name?.trim(),
    sourceBranch: sourceBranch.trim(),
    targetBranch: targetBranch.trim(),
    modelId: modelId?.trim(),
  };
}

/**
 * Parse and validate the run analysis request
 */
function parseRunAnalysisRequest(req: Request): RunAnalysisRequest {
  const { modelId } = req.body;
  
  return {
    modelId: modelId?.trim(),
  };
}

/**
 * Handle POST /api/review-sessions - Create a new review session
 * 
 * Request body:
 * {
 *   "repositoryId": "uuid",
 *   "name": "optional-name",
 *   "sourceBranch": "feature-branch",
 *   "targetBranch": "main",
 *   "modelId": "optional-model-id"
 * }
 */
export async function createReviewSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = parseCreateRequest(req);
    
    const session = await ReviewSessionService.create(dto);
    
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /api/review-sessions - List all review sessions
 * 
 * Query parameters:
 * - repositoryId (optional): Filter by repository
 */
export async function getAllReviewSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const repositoryId = req.query.repositoryId as string | undefined;
    
    const sessions = await ReviewSessionService.getAll(repositoryId);
    
    res.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /api/review-sessions/:id - Get a single review session with files and comments
 */
export async function getReviewSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const session = await ReviewSessionService.getById(id);
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Review session not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle POST /api/review-sessions/:id/analyze - Run AI analysis on a review session
 */
export async function runAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { modelId } = parseRunAnalysisRequest(req);
    
    // Check if session exists
    const exists = await ReviewSessionService.exists(id);
    if (!exists) {
      res.status(404).json({
        success: false,
        error: 'Review session not found',
      });
      return;
    }
    
    // Start the analysis (this runs asynchronously)
    // The client should poll GET /api/review-sessions/:id to check status
    const session = await ReviewSessionService.runAnalysis(id, modelId);
    
    res.json({
      success: true,
      data: session,
      message: 'Analysis completed',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle DELETE /api/review-sessions/:id - Delete a review session
 */
export async function deleteReviewSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const deleted = await ReviewSessionService.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Review session not found',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Review session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Review Session Routes
 * 
 * This module defines the API routes for review session operations.
 * All routes are mounted at /api/review-sessions
 */

import { Router } from 'express';
import {
  createReviewSession,
  getAllReviewSessions,
  getReviewSession,
  runAnalysis,
  deleteReviewSession,
} from '../controllers/ReviewSessionController';

const router = Router();

/**
 * POST /api/review-sessions
 * Create a new review session
 */
router.post('/', createReviewSession);

/**
 * GET /api/review-sessions
 * List all review sessions
 * Query params: ?repositoryId=uuid
 */
router.get('/', getAllReviewSessions);

/**
 * GET /api/review-sessions/:id
 * Get a single review session with files and comments
 */
router.get('/:id', getReviewSession);

/**
 * POST /api/review-sessions/:id/analyze
 * Run AI analysis on a review session
 */
router.post('/:id/analyze', runAnalysis);

/**
 * DELETE /api/review-sessions/:id
 * Delete a review session
 */
router.delete('/:id', deleteReviewSession);

export default router;

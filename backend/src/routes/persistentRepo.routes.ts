/**
 * Persistent Repository Routes
 * 
 * This module defines the API routes for persistent repository operations.
 * All routes are mounted at /api/persistent-repos
 */

import { Router } from 'express';
import {
  createRepository,
  getAllRepositories,
  getRepository,
  updateRepository,
  syncRepository,
  deleteRepository,
  getRepositoryBranches,
  getRepositoryFiles,
} from '../controllers/PersistentRepositoryController';

const router = Router();

/**
 * POST /api/persistent-repos
 * Create a new persistent repository
 */
router.post('/', createRepository);

/**
 * GET /api/persistent-repos
 * List all persistent repositories
 * Query params: ?includeInactive=true
 */
router.get('/', getAllRepositories);

/**
 * GET /api/persistent-repos/:id
 * Get a single repository by ID
 */
router.get('/:id', getRepository);

/**
 * PATCH /api/persistent-repos/:id
 * Update a repository (name, defaultBranch)
 */
router.patch('/:id', updateRepository);

/**
 * POST /api/persistent-repos/:id/sync
 * Sync a repository with its remote
 */
router.post('/:id/sync', syncRepository);

/**
 * DELETE /api/persistent-repos/:id
 * Delete a repository
 */
router.delete('/:id', deleteRepository);

/**
 * GET /api/persistent-repos/:id/branches
 * List all branches in a repository
 */
router.get('/:id/branches', getRepositoryBranches);

/**
 * GET /api/persistent-repos/:id/files
 * List all files in a repository
 */
router.get('/:id/files', getRepositoryFiles);

export default router;

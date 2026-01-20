/**
 * PersistentRepositoryController
 * 
 * This controller handles HTTP requests for persistent repository operations.
 * It provides REST API endpoints for creating, reading, updating, syncing,
 * and deleting persistent repositories.
 */

import { Request, Response, NextFunction } from 'express';
import { PersistentRepositoryService } from '../services/PersistentRepositoryService';
import { GITHUB_ACCESS_TOKEN } from '../config/constants';

/**
 * Request body for creating a persistent repository
 */
interface CreateRepoRequest {
  url: string;
  name?: string;
  branch?: string;
}

/**
 * Request body for updating a persistent repository
 */
interface UpdateRepoRequest {
  name?: string;
  defaultBranch?: string;
}

/**
 * Parse and validate the create repository request
 */
function parseCreateRequest(req: Request): CreateRepoRequest {
  const { url, name, branch } = req.body;
  
  if (!url) {
    throw new Error('Repository URL is required');
  }
  
  return {
    url: url.trim(),
    name: name?.trim(),
    branch: branch?.trim(),
  };
}

/**
 * Parse and validate the update repository request
 */
function parseUpdateRequest(req: Request): UpdateRepoRequest {
  const { name, defaultBranch } = req.body;
  
  return {
    name: name?.trim(),
    defaultBranch: defaultBranch?.trim(),
  };
}

/**
 * Handle POST /api/persistent-repos - Create a new persistent repository
 * 
 * Request body:
 * {
 *   "url": "https://github.com/owner/repo",
 *   "name": "optional-name",
 *   "branch": "main"
 * }
 */
export async function createRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { url, name, branch } = parseCreateRequest(req);
    
    const repository = await PersistentRepositoryService.create(
      url,
      name,
      branch || 'main',
      GITHUB_ACCESS_TOKEN
    );
    
    res.status(201).json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /api/persistent-repos - List all persistent repositories
 * 
 * Query parameters:
 * - includeInactive (boolean): Include inactive repositories
 */
export async function getAllRepositories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    
    const repositories = await PersistentRepositoryService.getAll({ includeInactive });
    
    res.json({
      success: true,
      data: repositories,
      count: repositories.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /api/persistent-repos/:id - Get a single repository
 */
export async function getRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const repository = await PersistentRepositoryService.getById(id);
    
    if (!repository) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle PATCH /api/persistent-repos/:id - Update a repository
 * 
 * Request body:
 * {
 *   "name": "new-name",
 *   "defaultBranch": "develop"
 * }
 */
export async function updateRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updates = parseUpdateRequest(req);
    
    const repository = await PersistentRepositoryService.update(id, updates);
    
    if (!repository) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle POST /api/persistent-repos/:id/sync - Sync a repository with remote
 */
export async function syncRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const repository = await PersistentRepositoryService.sync(id, GITHUB_ACCESS_TOKEN);
    
    res.json({
      success: true,
      data: repository,
      message: 'Repository synced successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle DELETE /api/persistent-repos/:id - Delete a repository
 */
export async function deleteRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const deleted = await PersistentRepositoryService.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Repository deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /api/persistent-repos/:id/branches - List repository branches
 */
export async function getRepositoryBranches(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const branches = await PersistentRepositoryService.getBranches(id);
    
    res.json({
      success: true,
      data: branches,
      count: branches.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /api/persistent-repos/:id/files - List repository files
 */
export async function getRepositoryFiles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const files = await PersistentRepositoryService.getFiles(id);
    
    res.json({
      success: true,
      data: files,
      count: files.length,
    });
  } catch (error) {
    next(error);
  }
}

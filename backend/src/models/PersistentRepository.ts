/**
 * PersistentRepository Model
 * 
 * This module defines the TypeScript interface and factory functions for
 * persistent repository records stored in PostgreSQL.
 * 
 * A PersistentRepository represents a repository that has been cloned to
 * persistent storage and tracked in the database for future use.
 */

import { Row } from '../database/connection';

/**
 * PersistentRepository interface representing a repository stored in the database
 */
export interface PersistentRepository {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  storagePath: string;
  createdAt: Date;
  lastSyncedAt: Date | null;
  isActive: boolean;
}

/**
 * Data Transfer Object for creating a new persistent repository
 */
export interface CreatePersistentRepositoryDTO {
  name: string;
  url: string;
  defaultBranch?: string;
}

/**
 * Data Transfer Object for updating a persistent repository
 */
export interface UpdatePersistentRepositoryDTO {
  name?: string;
  defaultBranch?: string;
  lastSyncedAt?: Date;
  isActive?: boolean;
}

/**
 * Database row type for persistent_repositories table
 */
interface PersistentRepositoryRow {
  id: string;
  name: string;
  url: string;
  default_branch: string;
  storage_path: string;
  created_at: Date;
  last_synced_at: Date | null;
  is_active: boolean;
}

/**
 * Create a PersistentRepository instance from a database row
 * 
 * @param row Database row from PostgreSQL
 * @returns PersistentRepository instance
 */
export function createPersistentRepository(row: PersistentRepositoryRow): PersistentRepository {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    defaultBranch: row.default_branch,
    storagePath: row.storage_path,
    createdAt: new Date(row.created_at),
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
    isActive: row.is_active,
  };
}

/**
 * Create an array of PersistentRepository instances from database rows
 * 
 * @param rows Array of database rows
 * @returns Array of PersistentRepository instances
 */
export function createPersistentRepositoryList(rows: PersistentRepositoryRow[]): PersistentRepository[] {
  return rows.map((row) => createPersistentRepository(row));
}

/**
 * Convert a PersistentRepository to a database row for insertion
 * 
 * @param repo The PersistentRepository to convert
 * @returns Object suitable for database insertion
 */
export function toInsertRow(repo: CreatePersistentRepositoryDTO & { storagePath: string }): {
  name: string;
  url: string;
  default_branch: string;
  storage_path: string;
} {
  return {
    name: repo.name,
    url: repo.url,
    default_branch: repo.defaultBranch || 'main',
    storage_path: repo.storagePath,
  };
}

/**
 * Convert a PersistentRepository to update parameters for database update
 * 
 * @param repo The PersistentRepository with updated fields
 * @returns Object with only the updated fields
 */
export function toUpdateRow(repo: UpdatePersistentRepositoryDTO): {
  name?: string;
  default_branch?: string;
  last_synced_at?: Date;
  is_active?: boolean;
} {
  const row: {
    name?: string;
    default_branch?: string;
    last_synced_at?: Date;
    is_active?: boolean;
  } = {};

  if (repo.name !== undefined) {
    row.name = repo.name;
  }
  if (repo.defaultBranch !== undefined) {
    row.default_branch = repo.defaultBranch;
  }
  if (repo.lastSyncedAt !== undefined) {
    row.last_synced_at = repo.lastSyncedAt;
  }
  if (repo.isActive !== undefined) {
    row.is_active = repo.isActive;
  }

  return row;
}

/**
 * Validate repository URL format
 * 
 * @param url The URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidRepositoryUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Must be a valid Git URL: http://, https://, git@, or git://
  const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
  return gitUrlPattern.test(url.trim());
}

/**
 * Extract repository name from URL
 * 
 * @param url The repository URL
 * @returns The extracted or generated repository name
 */
export function extractRepositoryName(url: string): string {
  // Try to extract name from common URL patterns
  const patterns = [
    // https://github.com/owner/repo
    /\/([^\/]+?)(?:\.git)?$/,
    // git@github.com:owner/repo
    /:([^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: generate a name from the URL
  return `repo-${Date.now()}`;
}

/**
 * Type guard to check if an object is a valid PersistentRepository
 * 
 * @param obj The object to check
 * @returns boolean indicating if object is a valid PersistentRepository
 */
export function isPersistentRepository(obj: any): obj is PersistentRepository {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.defaultBranch === 'string' &&
    typeof obj.storagePath === 'string' &&
    obj.createdAt instanceof Date &&
    (obj.lastSyncedAt === null || obj.lastSyncedAt instanceof Date) &&
    typeof obj.isActive === 'boolean'
  );
}

/**
 * Type for database query results
 */
export type PersistentRepositoryResult = Row<PersistentRepositoryRow>;

import * as path from 'path';

// UUID v4 regex pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates that a repoId is a valid UUID format
 * This prevents path traversal attacks through the repoId parameter
 */
export function validateRepoId(repoId: string): boolean {
  if (!repoId || typeof repoId !== 'string') {
    return false;
  }
  // Validate UUID v4 format
  return UUID_V4_REGEX.test(repoId);
}

/**
 * Validates and sanitizes a file path to prevent path traversal attacks
 * Ensures the resolved path stays within the base directory
 * 
 * @param filePath - The file path to validate (relative to baseDir)
 * @param baseDir - The base directory that the path must stay within
 * @returns The normalized, validated path or null if invalid
 */
export function validateFilePath(filePath: string, baseDir: string): string | null {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Reject absolute paths - file paths should be relative
  if (path.isAbsolute(filePath)) {
    return null;
  }

  // Normalize the path (removes redundant separators, resolves . and ..)
  const normalizedPath = path.normalize(filePath);

  // Check for path traversal attempts
  // After normalization, if the path contains .., it's trying to escape
  if (normalizedPath.includes('..')) {
    return null;
  }

  // Resolve the full path
  const resolvedPath = path.resolve(baseDir, normalizedPath);

  // Ensure the resolved path is within the base directory
  const resolvedBaseDir = path.resolve(baseDir);
  if (!resolvedPath.startsWith(resolvedBaseDir + path.sep) && resolvedPath !== resolvedBaseDir) {
    return null;
  }

  return normalizedPath;
}

/**
 * Validates a repoId and returns a safe repo path
 * 
 * @param repoId - The repository ID to validate
 * @param reposDir - The base directory for repositories
 * @returns The validated repo path or null if invalid
 */
export function validateRepoPath(repoId: string, reposDir: string): string | null {
  if (!validateRepoId(repoId)) {
    return null;
  }

  // repoId is a UUID, so it's safe to join directly
  // But we still validate it doesn't contain path separators
  if (repoId.includes(path.sep) || repoId.includes('/') || repoId.includes('\\')) {
    return null;
  }

  const repoPath = path.join(reposDir, repoId);
  const resolvedRepoPath = path.resolve(repoPath);
  const resolvedReposDir = path.resolve(reposDir);

  // Ensure the resolved path is within the repos directory
  if (!resolvedRepoPath.startsWith(resolvedReposDir + path.sep) && resolvedRepoPath !== resolvedReposDir) {
    return null;
  }

  return repoPath;
}

/**
 * Validates a Git branch name to prevent command injection attacks
 * Git branch names can contain alphanumeric, hyphens, underscores, forward slashes, and dots
 * but must not contain shell metacharacters or control sequences
 * 
 * @param branch - The branch name to validate
 * @returns true if the branch name is safe, false otherwise
 */
export function validateBranchName(branch: string): boolean {
  if (!branch || typeof branch !== 'string') {
    return false;
  }

  // Git branch name rules:
  // - Can contain: alphanumeric, hyphens, underscores, forward slashes, dots
  // - Cannot start or end with a dot
  // - Cannot contain consecutive dots (..)
  // - Cannot contain spaces, shell metacharacters, or control characters
  // - Cannot be empty or only whitespace
  const trimmed = branch.trim();
  
  if (trimmed.length === 0) {
    return false;
  }

  // Reject if starts or ends with dot
  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return false;
  }

  // Reject if contains consecutive dots (path traversal attempt)
  if (trimmed.includes('..')) {
    return false;
  }

  // Reject if contains shell metacharacters or control sequences
  // This prevents command injection: ; | & $ ` ( ) { } [ ] < > * ? ~ \ " ' space tab newline
  const dangerousChars = /[;|&$`(){}[\]<>*?~\\"' \t\n\r]|@{|\\\\/;
  if (dangerousChars.test(trimmed)) {
    return false;
  }

  // Only allow safe characters: alphanumeric, hyphens, underscores, forward slashes, dots
  const safeBranchPattern = /^[a-zA-Z0-9._\/-]+$/;
  return safeBranchPattern.test(trimmed);
}

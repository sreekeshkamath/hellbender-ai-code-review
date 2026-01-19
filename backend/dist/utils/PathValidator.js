"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRepoId = validateRepoId;
exports.validateFilePath = validateFilePath;
exports.validateRepoPath = validateRepoPath;
exports.validateBranchName = validateBranchName;
const path = __importStar(require("path"));
// UUID v4 regex pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Validates that a repoId is a valid UUID format
 * This prevents path traversal attacks through the repoId parameter
 */
function validateRepoId(repoId) {
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
function validateFilePath(filePath, baseDir) {
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
function validateRepoPath(repoId, reposDir) {
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
function validateBranchName(branch) {
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

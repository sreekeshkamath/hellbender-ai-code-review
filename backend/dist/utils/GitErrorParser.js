"use strict";
/**
 * Structured error detection for Git operations
 * Uses exit codes, regex patterns, and error structure instead of string matching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitErrorParser = exports.GitErrorType = void 0;
var GitErrorType;
(function (GitErrorType) {
    GitErrorType["BRANCH_NOT_FOUND"] = "BRANCH_NOT_FOUND";
    GitErrorType["REPOSITORY_NOT_FOUND"] = "REPOSITORY_NOT_FOUND";
    GitErrorType["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    GitErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    GitErrorType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    GitErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(GitErrorType || (exports.GitErrorType = GitErrorType = {}));
class GitErrorParser {
    /**
     * Parse git error from exec output
     */
    static parseExecError(error, stderr = '', stdout = '', branch) {
        const exitCode = error?.code || error?.exitCode;
        const errorOutput = this.normalizeOutput(stderr || error?.message || '');
        const stdOutput = this.normalizeOutput(stdout || '');
        // Check exit code first
        if (exitCode === this.EXIT_CODES.NOT_FOUND) {
            // Exit code 128 often indicates "not found" errors
            const branchError = this.detectBranchError(errorOutput, branch);
            if (branchError) {
                return branchError;
            }
        }
        // Try to match error patterns
        const branchError = this.detectBranchError(errorOutput, branch);
        if (branchError) {
            return branchError;
        }
        const repoError = this.detectRepositoryError(errorOutput);
        if (repoError) {
            return repoError;
        }
        const authError = this.detectAuthenticationError(errorOutput);
        if (authError) {
            return authError;
        }
        const networkError = this.detectNetworkError(errorOutput);
        if (networkError) {
            return networkError;
        }
        const permissionError = this.detectPermissionError(errorOutput);
        if (permissionError) {
            return permissionError;
        }
        // Fallback to generic error
        return {
            type: GitErrorType.UNKNOWN_ERROR,
            message: this.extractErrorMessage(errorOutput, error),
            originalError: error,
            branch,
        };
    }
    /**
     * Parse simple-git error
     */
    static parseSimpleGitError(error, branch) {
        // simple-git errors often have a 'git' property with the command output
        const gitOutput = error?.git?.stderr || error?.git?.stdout || '';
        const errorMessage = error?.message || '';
        const combinedOutput = `${gitOutput} ${errorMessage}`;
        const normalized = this.normalizeOutput(combinedOutput);
        // Try all error detection methods
        const branchError = this.detectBranchError(normalized, branch);
        if (branchError) {
            return branchError;
        }
        const repoError = this.detectRepositoryError(normalized);
        if (repoError) {
            return repoError;
        }
        const authError = this.detectAuthenticationError(normalized);
        if (authError) {
            return authError;
        }
        const networkError = this.detectNetworkError(normalized);
        if (networkError) {
            return networkError;
        }
        return {
            type: GitErrorType.UNKNOWN_ERROR,
            message: this.extractErrorMessage(normalized, error),
            originalError: error,
            branch,
        };
    }
    static detectBranchError(output, branch) {
        for (const pattern of this.ERROR_PATTERNS.BRANCH_NOT_FOUND) {
            const match = output.match(pattern);
            if (match) {
                const detectedBranch = match[1] || branch || 'unknown';
                return {
                    type: GitErrorType.BRANCH_NOT_FOUND,
                    message: `Branch "${detectedBranch}" not found in repository. Please check the branch name and try again.`,
                    branch: detectedBranch,
                };
            }
        }
        return null;
    }
    static detectRepositoryError(output) {
        for (const pattern of this.ERROR_PATTERNS.REPOSITORY_NOT_FOUND) {
            if (pattern.test(output)) {
                return {
                    type: GitErrorType.REPOSITORY_NOT_FOUND,
                    message: 'Repository not found. Please verify the repository URL is correct.',
                };
            }
        }
        return null;
    }
    static detectAuthenticationError(output) {
        for (const pattern of this.ERROR_PATTERNS.AUTHENTICATION_FAILED) {
            if (pattern.test(output)) {
                return {
                    type: GitErrorType.AUTHENTICATION_FAILED,
                    message: 'Authentication failed. Please check your credentials or access token.',
                };
            }
        }
        return null;
    }
    static detectNetworkError(output) {
        for (const pattern of this.ERROR_PATTERNS.NETWORK_ERROR) {
            if (pattern.test(output)) {
                return {
                    type: GitErrorType.NETWORK_ERROR,
                    message: 'Network error occurred. Please check your internet connection and try again.',
                };
            }
        }
        return null;
    }
    static detectPermissionError(output) {
        for (const pattern of this.ERROR_PATTERNS.PERMISSION_DENIED) {
            if (pattern.test(output)) {
                return {
                    type: GitErrorType.PERMISSION_DENIED,
                    message: 'Permission denied. You may not have access to this repository.',
                };
            }
        }
        return null;
    }
    static normalizeOutput(output) {
        if (Buffer.isBuffer(output)) {
            return output.toString('utf-8');
        }
        return String(output || '').trim();
    }
    static extractErrorMessage(output, error) {
        // Try to extract a meaningful error message
        const lines = output.split('\n').filter(line => line.trim());
        // Look for "fatal:" or "error:" lines first
        const fatalLine = lines.find(line => /fatal:/i.test(line));
        if (fatalLine) {
            return fatalLine.replace(/^fatal:\s*/i, '').trim();
        }
        const errorLine = lines.find(line => /error:/i.test(line));
        if (errorLine) {
            return errorLine.replace(/^error:\s*/i, '').trim();
        }
        // Fallback to first non-empty line or error message
        return lines[0] || error?.message || 'Unknown error occurred';
    }
}
exports.GitErrorParser = GitErrorParser;
// Git exit codes (from git documentation)
GitErrorParser.EXIT_CODES = {
    SUCCESS: 0,
    GENERIC_ERROR: 1,
    MISUSE: 2,
    NOT_FOUND: 128,
    CONFLICT: 1, // Can also be 1
};
// Regex patterns for specific error types
GitErrorParser.ERROR_PATTERNS = {
    BRANCH_NOT_FOUND: [
        /fatal:\s+couldn't\s+find\s+remote\s+ref\s+['"]?([^'"]+)['"]?/i,
        /fatal:\s+remote\s+branch\s+['"]?([^'"]+)['"]?\s+not\s+found/i,
        /error:\s+pathspec\s+['"]?([^'"]+)['"]?\s+did\s+not\s+match\s+any\s+file/i,
        /could\s+not\s+find\s+remote\s+branch\s+['"]?([^'"]+)['"]?/i,
    ],
    REPOSITORY_NOT_FOUND: [
        /repository\s+not\s+found/i,
        /could\s+not\s+read\s+from\s+remote\s+repository/i,
        /fatal:\s+repository\s+not\s+found/i,
        /remote:\s+repository\s+not\s+found/i,
    ],
    AUTHENTICATION_FAILED: [
        /authentication\s+failed/i,
        /permission\s+denied/i,
        /unauthorized/i,
        /invalid\s+credentials/i,
        /fatal:\s+authentication\s+failed/i,
    ],
    NETWORK_ERROR: [
        /connection\s+refused/i,
        /network\s+unreachable/i,
        /timeout/i,
        /could\s+not\s+resolve\s+host/i,
        /failed\s+to\s+connect/i,
    ],
    PERMISSION_DENIED: [
        /permission\s+denied/i,
        /access\s+denied/i,
        /forbidden/i,
    ],
};

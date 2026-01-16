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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const simple_git_1 = __importDefault(require("simple-git"));
const uuid_1 = require("uuid");
const FileService_1 = require("./FileService");
const RepositoryMappingService_1 = require("./RepositoryMappingService");
const constants_1 = require("../config/constants");
const GitErrorParser_1 = require("../utils/GitErrorParser");
const PathValidator_1 = require("../utils/PathValidator");
class RepositoryService {
    static isValidRepoUrl(url) {
        if (!url || typeof url !== 'string')
            return false;
        // Must be a valid Git URL: http://, https://, git@, or git://
        const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
        return gitUrlPattern.test(url.trim());
    }
    static async clone(repoUrl, branch = 'main', accessToken) {
        if (!this.isValidRepoUrl(repoUrl)) {
            throw new Error('Please enter a valid Git repository URL (e.g., https://github.com/username/repo)');
        }
        // Check if repository is already cloned
        let repoId = RepositoryMappingService_1.RepositoryMappingService.getRepoId(repoUrl, branch);
        if (repoId && RepositoryMappingService_1.RepositoryMappingService.repoExists(repoId, constants_1.REPOS_DIR)) {
            // Repository already exists, return existing data
            const repoPath = path.join(constants_1.REPOS_DIR, repoId);
            const filePaths = FileService_1.FileService.getAllFiles(repoPath);
            const files = filePaths.map(f => ({
                path: path.relative(repoPath, f),
                size: fs.statSync(f).size
            }));
            console.log(`Reusing existing repository: ${repoUrl} (${branch}) -> ${repoId}`);
            return {
                repoId,
                repoPath,
                files,
                cached: true
            };
        }
        // Repository doesn't exist, clone it
        repoId = (0, uuid_1.v4)();
        const repoPath = path.join(constants_1.REPOS_DIR, repoId);
        const git = (0, simple_git_1.default)();
        const authRepoUrl = accessToken
            ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
            : repoUrl;
        console.log(`Cloning new repository: ${repoUrl} (${branch}) -> ${repoId}`);
        // Use shallow clone for faster cloning
        const { exec } = require('child_process');
        const cloneCommand = `git clone --depth 1 ${branch !== 'main' ? `--branch ${branch} --single-branch` : ''} "${authRepoUrl}" "${repoPath}"`;
        await new Promise((resolve, reject) => {
            exec(cloneCommand, (error, stdout, stderr) => {
                if (error) {
                    // Use structured error parser instead of string matching
                    const parsedError = GitErrorParser_1.GitErrorParser.parseExecError(error, stderr, stdout, branch);
                    reject(new Error(parsedError.message));
                }
                else {
                    resolve(stdout);
                }
            });
        });
        // Store the mapping
        RepositoryMappingService_1.RepositoryMappingService.setRepoId(repoUrl, branch, repoId);
        const filePaths = FileService_1.FileService.getAllFiles(repoPath);
        const files = filePaths.map(f => ({
            path: path.relative(repoPath, f),
            size: fs.statSync(f).size
        }));
        return {
            repoId,
            repoPath,
            files,
            cached: false
        };
    }
    static async sync(repoId, repoUrl, branch = 'main', accessToken) {
        // Validate repoId to prevent path traversal
        const repoPath = (0, PathValidator_1.validateRepoPath)(repoId, constants_1.REPOS_DIR);
        if (!repoPath) {
            throw new Error('Invalid repository ID');
        }
        if (!fs.existsSync(repoPath)) {
            throw new Error('Repository not found');
        }
        if (!repoUrl) {
            throw new Error('Repository URL is required for sync');
        }
        const git = (0, simple_git_1.default)(repoPath);
        const authRepoUrl = accessToken
            ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
            : repoUrl;
        try {
            await git.fetch('origin', branch);
            await git.reset(['--hard', `origin/${branch}`]);
        }
        catch (error) {
            // Use structured error parser for simple-git errors
            const parsedError = GitErrorParser_1.GitErrorParser.parseSimpleGitError(error, branch);
            // Throw with the parsed error message (already user-friendly)
            throw new Error(parsedError.message);
        }
        const filePaths = FileService_1.FileService.getAllFiles(repoPath);
        const files = filePaths.map(f => ({
            path: path.relative(repoPath, f),
            size: fs.statSync(f).size
        }));
        return {
            repoId,
            repoPath,
            files,
            cached: false
        };
    }
    static getFiles(repoId) {
        // Validate repoId to prevent path traversal
        const repoPath = (0, PathValidator_1.validateRepoPath)(repoId, constants_1.REPOS_DIR);
        if (!repoPath) {
            throw new Error('Invalid repository ID');
        }
        if (!fs.existsSync(repoPath)) {
            throw new Error('Repository not found');
        }
        const filePaths = FileService_1.FileService.getAllFiles(repoPath);
        return filePaths.map(f => ({
            path: path.relative(repoPath, f),
            size: fs.statSync(f).size
        }));
    }
    static getFile(repoId, filePath) {
        // Validate repoId to prevent path traversal
        const repoPath = (0, PathValidator_1.validateRepoPath)(repoId, constants_1.REPOS_DIR);
        if (!repoPath) {
            throw new Error('Invalid repository ID');
        }
        // Validate file path to prevent path traversal
        const validatedFilePath = (0, PathValidator_1.validateFilePath)(filePath, repoPath);
        if (!validatedFilePath) {
            throw new Error('Invalid file path');
        }
        const fullPath = path.join(repoPath, validatedFilePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error('File not found');
        }
        return fs.readFileSync(fullPath, 'utf-8');
    }
    static delete(repoId) {
        // Validate repoId to prevent path traversal attacks
        // This is critical as we use fs.rmSync with recursive: true
        const repoPath = (0, PathValidator_1.validateRepoPath)(repoId, constants_1.REPOS_DIR);
        if (!repoPath) {
            throw new Error('Invalid repository ID');
        }
        // Remove from mappings
        const mappings = RepositoryMappingService_1.RepositoryMappingService.getAllMappings();
        for (const [key, mappedRepoId] of Object.entries(mappings)) {
            if (mappedRepoId === repoId) {
                const parsed = RepositoryMappingService_1.RepositoryMappingService.parseKey(key);
                if (parsed) {
                    RepositoryMappingService_1.RepositoryMappingService.removeMapping(parsed.repoUrl, parsed.branch);
                }
                else {
                    console.warn(`Invalid mapping key format: ${key}`);
                }
                break;
            }
        }
        if (fs.existsSync(repoPath)) {
            fs.rmSync(repoPath, { recursive: true, force: true });
        }
    }
    static cloneWithDefaults(repoUrl, branch) {
        return this.clone(repoUrl, branch, constants_1.GITHUB_ACCESS_TOKEN);
    }
    static syncWithDefaults(repoId, repoUrl, branch) {
        return this.sync(repoId, repoUrl, branch, constants_1.GITHUB_ACCESS_TOKEN);
    }
    static async getChangedFiles(repoId, targetBranch, currentBranch) {
        // Validate repoId to prevent path traversal
        const repoPath = (0, PathValidator_1.validateRepoPath)(repoId, constants_1.REPOS_DIR);
        if (!repoPath) {
            throw new Error('Invalid repository ID');
        }
        if (!fs.existsSync(repoPath)) {
            throw new Error('Repository not found');
        }
        const git = (0, simple_git_1.default)(repoPath);
        try {
            // Fetch all branches to ensure we have both branches
            await git.fetch(['--all']);
            // Get the current branch if not specified
            if (!currentBranch) {
                const branchSummary = await git.branchLocal();
                currentBranch = branchSummary.current || 'main';
            }
            // Get changed files: files that differ between targetBranch and currentBranch
            // This shows what has changed in currentBranch compared to targetBranch
            const diffSummary = await git.diffSummary([`origin/${targetBranch}`, `origin/${currentBranch}`]);
            // Filter only modified and added files (exclude deleted)
            const changedFiles = [];
            for (const file of diffSummary.files) {
                if (file.binary)
                    continue; // Skip binary files
                // Skip files that were only deleted (no insertions, only deletions)
                if (file.insertions === 0 && file.deletions > 0)
                    continue;
                // Check if file exists in current branch (it should since we're on it)
                const filePath = path.join(repoPath, file.file);
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    changedFiles.push({
                        path: file.file,
                        size: stats.size
                    });
                }
            }
            return changedFiles;
        }
        catch (error) {
            const parsedError = GitErrorParser_1.GitErrorParser.parseSimpleGitError(error, targetBranch);
            throw new Error(parsedError.message);
        }
    }
}
exports.RepositoryService = RepositoryService;

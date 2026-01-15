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
const uuid_1 = require("uuid");
const simple_git_1 = __importDefault(require("simple-git"));
const FileService_1 = require("./FileService");
const RepositoryMappingService_1 = require("./RepositoryMappingService");
class RepositoryService {
    static isValidRepoUrl(url) {
        if (!url || typeof url !== 'string')
            return false;
        // Must be a valid Git URL: http://, https://, git@, or git://
        const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
        return gitUrlPattern.test(url.trim());
    }
    static async clone(repoUrl, branch = 'main', accessToken) {
        if (!fs.existsSync(this.REPOS_DIR)) {
            fs.mkdirSync(this.REPOS_DIR, { recursive: true });
        }
        if (!this.isValidRepoUrl(repoUrl)) {
            throw new Error('Please enter a valid Git repository URL (e.g., https://github.com/username/repo)');
        }
        // Check if repository is already cloned
        let repoId = RepositoryMappingService_1.RepositoryMappingService.getRepoId(repoUrl, branch);
        if (repoId && RepositoryMappingService_1.RepositoryMappingService.repoExists(repoId, this.REPOS_DIR)) {
            // Repository already exists, return existing data
            const repoPath = path.join(this.REPOS_DIR, repoId);
            const allFiles = FileService_1.FileService.getAllFiles(repoPath);
            const files = allFiles.map(f => ({
                path: path.relative(repoPath, f),
                size: fs.statSync(f).size
            }));
            return {
                repoId,
                repoPath,
                files,
                cached: true
            };
        }
        // Repository doesn't exist, clone it
        repoId = (0, uuid_1.v4)();
        const repoPath = path.join(this.REPOS_DIR, repoId);
        const git = (0, simple_git_1.default)();
        const authRepoUrl = accessToken
            ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
            : repoUrl;
        const cloneOptions = branch !== 'main' ? ['--branch', branch, '--single-branch'] : [];
        await git.clone(authRepoUrl, repoPath, cloneOptions);
        // Store the mapping
        RepositoryMappingService_1.RepositoryMappingService.setRepoId(repoUrl, branch, repoId);
        const allFiles = FileService_1.FileService.getAllFiles(repoPath);
        const files = allFiles.map(f => ({
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
        const repoPath = path.join(this.REPOS_DIR, repoId);
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
        await git.fetch('origin', branch || 'main');
        await git.reset(['hard', `origin/${branch || 'main'}`]);
        const allFiles = FileService_1.FileService.getAllFiles(repoPath);
        const files = allFiles.map(f => ({
            path: path.relative(repoPath, f),
            size: fs.statSync(f).size
        }));
        return {
            repoId,
            repoPath,
            files
        };
    }
    static getFiles(repoId) {
        const repoPath = path.join(this.REPOS_DIR, repoId);
        if (!fs.existsSync(repoPath)) {
            throw new Error('Repository not found');
        }
        const allFiles = FileService_1.FileService.getAllFiles(repoPath);
        return allFiles.map(f => ({
            path: path.relative(repoPath, f),
            size: fs.statSync(f).size
        }));
    }
    static readFile(repoId, filePath) {
        const repoPath = path.join(this.REPOS_DIR, repoId);
        const fullPath = path.join(repoPath, filePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error('File not found');
        }
        return fs.readFileSync(fullPath, 'utf-8');
    }
    static delete(repoId) {
        // Remove from mappings
        const mappings = RepositoryMappingService_1.RepositoryMappingService.getAllMappings();
        for (const [key, mappedRepoId] of Object.entries(mappings)) {
            if (mappedRepoId === repoId) {
                const [repoUrl, branch] = key.split(':');
                RepositoryMappingService_1.RepositoryMappingService.removeMapping(repoUrl, branch);
                break;
            }
        }
        const repoPath = path.join(this.REPOS_DIR, repoId);
        if (fs.existsSync(repoPath)) {
            fs.rmSync(repoPath, { recursive: true, force: true });
        }
    }
}
exports.RepositoryService = RepositoryService;
RepositoryService.REPOS_DIR = path.join(__dirname, '../../../temp/repos');

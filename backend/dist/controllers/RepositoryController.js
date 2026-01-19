"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryController = void 0;
const RepositoryService_1 = require("../services/RepositoryService");
const PathValidator_1 = require("../utils/PathValidator");
class RepositoryController {
    static async clone(req, res) {
        try {
            const { repoUrl, branch } = req.body;
            // Validate branch name early to prevent command injection
            if (branch && !(0, PathValidator_1.validateBranchName)(branch)) {
                res.status(400).json({
                    error: 'Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
                });
                return;
            }
            const result = await RepositoryService_1.RepositoryService.cloneWithDefaults(repoUrl, branch);
            res.json(result);
        }
        catch (error) {
            console.error('Clone error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async sync(req, res) {
        try {
            const { repoId } = req.params;
            const { repoUrl, branch } = req.body;
            // Validate branch name early to prevent command injection
            if (branch && !(0, PathValidator_1.validateBranchName)(branch)) {
                res.status(400).json({
                    error: 'Invalid branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
                });
                return;
            }
            const result = await RepositoryService_1.RepositoryService.syncWithDefaults(repoId, repoUrl, branch);
            res.json(result);
        }
        catch (error) {
            console.error('Sync error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static getFiles(req, res) {
        try {
            const { repoId } = req.params;
            const files = RepositoryService_1.RepositoryService.getFiles(repoId);
            res.json({ files });
        }
        catch (error) {
            console.error('Files error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static getFile(req, res) {
        try {
            const { repoId } = req.params;
            const filePath = req.params[0];
            const content = RepositoryService_1.RepositoryService.getFile(repoId, filePath);
            res.json({ content });
        }
        catch (error) {
            console.error('Read error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static delete(req, res) {
        try {
            const { repoId } = req.params;
            RepositoryService_1.RepositoryService.delete(repoId);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Delete error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async getChangedFiles(req, res) {
        try {
            const { repoId } = req.params;
            const { targetBranch, currentBranch } = req.query;
            if (!targetBranch || typeof targetBranch !== 'string') {
                res.status(400).json({ error: 'targetBranch query parameter is required' });
                return;
            }
            // Validate branch names early to prevent command injection
            if (!(0, PathValidator_1.validateBranchName)(targetBranch)) {
                res.status(400).json({
                    error: 'Invalid target branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
                });
                return;
            }
            if (currentBranch && typeof currentBranch === 'string' && !(0, PathValidator_1.validateBranchName)(currentBranch)) {
                res.status(400).json({
                    error: 'Invalid current branch name. Branch names can only contain alphanumeric characters, hyphens, underscores, forward slashes, and dots.'
                });
                return;
            }
            const files = await RepositoryService_1.RepositoryService.getChangedFiles(repoId, targetBranch, typeof currentBranch === 'string' ? currentBranch : undefined);
            res.json({ files });
        }
        catch (error) {
            console.error('Changed files error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.RepositoryController = RepositoryController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryController = void 0;
const RepositoryService_1 = require("../services/RepositoryService");
class RepositoryController {
    static async clone(req, res) {
        try {
            const { repoUrl, branch } = req.body;
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
}
exports.RepositoryController = RepositoryController;

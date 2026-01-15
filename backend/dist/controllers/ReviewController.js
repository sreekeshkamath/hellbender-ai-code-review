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
exports.ReviewController = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const AnalysisService_1 = require("../services/AnalysisService");
const constants_1 = require("../config/constants");
const MODELS = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
];
class ReviewController {
    static getModels(req, res) {
        res.json(MODELS);
    }
    static async analyze(req, res) {
        try {
            const { repoId, model, files } = req.body;
            if (!repoId || !model || !files || files.length === 0) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const repoPath = path.join(constants_1.REPOS_DIR, repoId);
            if (!fs.existsSync(repoPath)) {
                res.status(400).json({ error: 'Repository not found' });
                return;
            }
            const results = [];
            for (const file of files) {
                const filePath = path.join(repoPath, file.path);
                if (!fs.existsSync(filePath)) {
                    results.push({
                        file: file.path,
                        error: 'File not found'
                    });
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const analysis = await AnalysisService_1.AnalysisService.analyzeCode(content, file.path, model);
                results.push({
                    file: file.path,
                    ...analysis
                });
            }
            const overallScore = ReviewController.calculateOverallScore(results);
            const vulnerabilityCount = ReviewController.countVulnerabilities(results);
            const response = {
                results,
                summary: {
                    overallScore,
                    totalFiles: results.length,
                    vulnerabilityCount,
                    reviewedAt: new Date().toISOString()
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Analysis error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static calculateOverallScore(results) {
        const scores = results
            .filter(r => r.score !== undefined)
            .map(r => r.score);
        if (scores.length === 0)
            return 100;
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        return Math.round(avgScore);
    }
    static countVulnerabilities(results) {
        return results.reduce((count, result) => {
            return count + (result.vulnerabilities ? result.vulnerabilities.length : 0);
        }, 0);
    }
}
exports.ReviewController = ReviewController;

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
class ReviewController {
    static async getModels(req, res) {
        try {
            const models = await AnalysisService_1.AnalysisService.getOpenRouterModels();
            res.json(models);
        }
        catch (error) {
            console.error('Failed to fetch OpenRouter models:', error);
            res.status(500).json({ error: 'Failed to fetch available models' });
        }
    }
    static async analyze(req, res) {
        try {
            const { repoId, model, files } = req.body;
            if (!repoId || !model || !files || files.length === 0) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            console.log(`Starting analysis: ${files.length} files, model: ${model}`);
            const repoPath = path.join(constants_1.REPOS_DIR, repoId);
            if (!fs.existsSync(repoPath)) {
                res.status(400).json({ error: 'Repository not found' });
                return;
            }
            // Process files in parallel with concurrency limit to avoid rate limiting
            const CONCURRENCY_LIMIT = 3; // Process 3 files at a time
            const results = [];
            // Helper function to analyze a single file
            const analyzeFile = async (file, index) => {
                const filePath = path.join(repoPath, file.path);
                if (!fs.existsSync(filePath)) {
                    console.warn(`File not found: ${file.path}`);
                    return {
                        file: file.path,
                        error: 'File not found'
                    };
                }
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    console.log(`[${index + 1}/${files.length}] Analyzing: ${file.path} (${content.length} chars)`);
                    const analysis = await AnalysisService_1.AnalysisService.analyzeCode(content, file.path, model);
                    console.log(`[${index + 1}/${files.length}] ✓ Complete: ${file.path}`);
                    return {
                        file: file.path,
                        ...analysis
                    };
                }
                catch (fileError) {
                    console.error(`[${index + 1}/${files.length}] ✗ Error analyzing ${file.path}:`, fileError);
                    return {
                        file: file.path,
                        error: fileError.message
                    };
                }
            };
            // Process files in batches with concurrency limit
            for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
                const batch = files.slice(i, i + CONCURRENCY_LIMIT);
                const batchPromises = batch.map((file, batchIndex) => analyzeFile(file, i + batchIndex));
                console.log(`Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} (${batch.length} files in parallel)...`);
                // Use allSettled so one failure doesn't stop others
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, batchIndex) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    }
                    else {
                        const file = batch[batchIndex];
                        console.error(`Failed to process ${file.path}:`, result.reason);
                        results.push({
                            file: file.path,
                            error: result.reason?.message || 'Unknown error'
                        });
                    }
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

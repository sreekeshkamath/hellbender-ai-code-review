const express = require('express');
const router = express.Router();
const { analyzeCode } = require('../utils/openrouter');
const fs = require('fs');
const path = require('path');

const REPOS_DIR = path.join(__dirname, '../temp/repos');

const MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
];

router.get('/models', (req, res) => {
  res.json(MODELS);
});

router.post('/analyze', async (req, res) => {
  try {
    const { repoId, model, files } = req.body;

    if (!repoId || !model || !files || files.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const repoPath = path.join(REPOS_DIR, repoId);

    if (!fs.existsSync(repoPath)) {
      return res.status(400).json({ error: 'Repository not found' });
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
      const analysis = await analyzeCode(content, file.path, model);

      results.push({
        file: file.path,
        ...analysis
      });
    }

    const overallScore = calculateOverallScore(results);
    const vulnerabilityCount = countVulnerabilities(results);

    res.json({
      results,
      summary: {
        overallScore,
        totalFiles: results.length,
        vulnerabilityCount,
        reviewedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

function calculateOverallScore(results) {
  const scores = results
    .filter(r => r.score !== undefined)
    .map(r => r.score);
  
  if (scores.length === 0) return 100;
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avgScore);
}

function countVulnerabilities(results) {
  return results.reduce((count, result) => {
    return count + (result.vulnerabilities ? result.vulnerabilities.length : 0);
  }, 0);
}

module.exports = router;

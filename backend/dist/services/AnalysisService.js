"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const OpenAI = require('openai');
class AnalysisService {
    static async analyzeCode(content, filePath, model) {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OPENROUTER_API_KEY environment variable is required');
        }
        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3001',
                'X-Title': 'AI Code Reviewer'
            }
        });
        const vulnerabilities = require('./VulnerabilityScanner').VulnerabilityScanner.detectVulnerabilities(content);
        const prompt = `You are an expert code reviewer. Analyze the following code and provide a detailed review:

File: ${filePath}

${content}

Please provide your analysis in the following JSON format:
{
  "score": <overall code quality score 0-100>,
  "issues": [
    {
      "line": <line number>,
      "type": "bug|performance|style|security|bestpractice",
      "severity": "low|medium|high|critical",
      "message": "<brief description>",
      "code": "<the exact line or snippet of code where the issue is found, INCLUDING 2-3 lines of surrounding context for better understanding>",
      "suggestion": "<how to fix>"
    }
  ],
  "strengths": ["<list of good practices observed>"],
  "summary": "<2-3 sentence overall summary>"
}

Focus on:
1. Potential bugs and edge cases
2. Performance issues
3. Security vulnerabilities
4. Code style and best practices
5. Maintainability concerns

Return ONLY valid JSON, no markdown formatting.`;
        try {
            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert code reviewer. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.3
            });
            const responseText = completion.choices[0].message.content;
            const analysis = JSON.parse(responseText);
            return {
                ...analysis,
                vulnerabilities: [...vulnerabilities, ...(analysis.securityIssues || [])]
            };
        }
        catch (error) {
            console.error('OpenRouter API error:', error);
            return {
                score: 70,
                issues: [],
                strengths: [],
                summary: 'Analysis completed with limited AI insights due to API error.',
                vulnerabilities,
                error: error.message
            };
        }
    }
}
exports.AnalysisService = AnalysisService;

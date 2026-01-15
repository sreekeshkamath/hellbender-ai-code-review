const OpenAI = require('openai');
import { AnalysisResult } from '../models/AnalysisResult';
import { VulnerabilityScanner } from './VulnerabilityScanner';
import { OPENROUTER_API_KEY, SITE_URL } from '../config/constants';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY as string,
  defaultHeaders: {
    'HTTP-Referer': SITE_URL,
    'X-Title': 'AI Code Reviewer'
  }
});

export class AnalysisService {
  static async analyzeCode(content: string, filePath: string, model: string): Promise<Omit<AnalysisResult, 'file'>> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    const vulnerabilities = VulnerabilityScanner.detectVulnerabilities(content);

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
    } catch (error) {
      console.error('OpenRouter API error:', error);

      return {
        score: 70,
        issues: [],
        strengths: [],
        summary: 'Analysis completed with limited AI insights due to API error.',
        vulnerabilities,
        error: (error as Error).message
      };
    }
  }
}
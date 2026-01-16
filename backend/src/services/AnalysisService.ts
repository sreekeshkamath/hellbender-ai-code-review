const OpenAI = require('openai');

import * as https from 'https';

export class AnalysisService {
  static async getOpenRouterModels(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'openrouter.ai',
        path: '/api/v1/models',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'X-Title': 'AI Code Reviewer'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.data) {
              // Map OpenRouter models to our frontend Model type
              const models = response.data.map((m: any) => ({
                id: m.id,
                name: m.name || m.id,
                provider: m.id.split('/')[0] || 'Unknown'
              }));
              resolve(models);
            } else {
              resolve([]);
            }
          } catch (e) {
            reject(new Error('Failed to parse OpenRouter models response'));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.end();
    });
  }

  static async analyzeCode(content: string, filePath: string, model: string): Promise<any> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    const openai = new (OpenAI as any)({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      timeout: 120000, // 2 minutes per file
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
      const codePreview = content.length > 500 
        ? content.substring(0, 500) + '...' 
        : content;
      const lineCount = content.split('\n').length;
      
      console.log(`[ANALYSIS] Sending code to AI agent:`);
      console.log(`  File: ${filePath}`);
      console.log(`  Model: ${model}`);
      console.log(`  Size: ${content.length} chars, ${lineCount} lines`);
      console.log(`  Code preview (first 500 chars):`);
      console.log(`  ${'─'.repeat(60)}`);
      console.log(codePreview.split('\n').slice(0, 10).map(line => `  ${line}`).join('\n'));
      if (lineCount > 10) console.log(`  ... (${lineCount - 10} more lines)`);
      console.log(`  ${'─'.repeat(60)}`);
      
      const startTime = Date.now();
      
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

      const elapsed = Date.now() - startTime;
      console.log(`[ANALYSIS] AI agent response received in ${elapsed}ms for ${filePath}`);

      const responseText = completion.choices[0].message.content;
      let analysis;
      
      try {
        // More robust JSON extraction: find the first '{' and last '}'
        let cleanResponse = responseText.trim();
        const firstBrace = cleanResponse.indexOf('{');
        const lastBrace = cleanResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
        }
        
        analysis = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Invalid JSON response from AI model');
      }

      return {
        ...analysis,
        vulnerabilities: [...vulnerabilities, ...(analysis.securityIssues || [])]
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`OpenRouter API error for ${filePath}:`, errorMessage);

      // If it's a timeout, provide a more specific message
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        return {
          score: 70,
          issues: [],
          strengths: [],
          summary: 'Analysis timed out. The AI model took too long to respond.',
          vulnerabilities,
          error: 'Request timeout - AI model response exceeded time limit'
        };
      }

      return {
        score: 70,
        issues: [],
        strengths: [],
        summary: 'Analysis completed with limited AI insights due to API error.',
        vulnerabilities,
        error: errorMessage
      };
    }
  }
}
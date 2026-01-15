const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3001',
    'X-Title': 'AI Code Reviewer'
  }
});

const VULNERABILITY_PATTERNS = [
  { pattern: /password\s*=/i, severity: 'high', type: 'Hardcoded credentials' },
  { pattern: /api[_-]?key\s*=/i, severity: 'high', type: 'Hardcoded API key' },
  { pattern: /secret\s*=/i, severity: 'high', type: 'Hardcoded secret' },
  { pattern: /eval\s*\(/i, severity: 'high', type: 'Code injection risk (eval)' },
  { pattern: /exec\s*\(/i, severity: 'high', type: 'Command injection risk' },
  { pattern: /innerHTML/i, severity: 'medium', type: 'XSS vulnerability' },
  { pattern: /dangerouslySetInnerHTML/i, severity: 'medium', type: 'XSS vulnerability' },
  { pattern: /sql\s*injection/i, severity: 'high', type: 'SQL injection' },
  { pattern: /SELECT.*FROM.*WHERE.*\+/i, severity: 'medium', type: 'SQL injection risk' },
  { pattern: /\.env/i, severity: 'medium', type: 'Environment file access' },
  { pattern: /process\.env/i, severity: 'low', type: 'Environment variable usage' },
  { pattern: /crypto\.createHash\('md5'/i, severity: 'medium', type: 'Weak hashing algorithm (MD5)' },
  { pattern: /Math\.random\(\)/i, severity: 'medium', type: 'Weak random number generator' },
  { pattern: /http:\/\//i, severity: 'medium', type: 'Insecure HTTP protocol' },
  { pattern: /console\.log/i, severity: 'low', type: 'Debug code left in production' },
  { pattern: /TODO/i, severity: 'low', type: 'TODO comment found' },
  { pattern: /FIXME/i, severity: 'low', type: 'FIXME comment found' },
  { pattern: /async\s+function\s+\w+\s*\([^)]*\)\s*{[^}]*await\s+[^}]+}/i, severity: 'low', type: 'Async function structure' },
  { pattern: /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/i, severity: 'low', type: 'Try-catch structure' }
];

async function analyzeCode(content, filePath, model) {
  const vulnerabilities = detectVulnerabilities(content);
  
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
      "code": "<the exact line or snippet of code where the issue is found>",
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
      error: error.message
    };
  }
}

function detectVulnerabilities(content) {
  const lines = content.split('\n');
  const vulnerabilities = [];

  VULNERABILITY_PATTERNS.forEach(({ pattern, severity, type }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        vulnerabilities.push({
          line: index + 1,
          type,
          severity,
          code: line.trim().substring(0, 100)
        });
      }
    });
  });

  return vulnerabilities;
}

module.exports = { analyzeCode };

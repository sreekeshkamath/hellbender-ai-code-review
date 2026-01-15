import path from 'path';

// Application constants
export const DEFAULT_PORT = 3001;
export const APP_NAME = 'AI Code Reviewer';

// Directory and file paths
export const DATA_DIR = path.join(process.cwd(), 'data');
export const REPOS_FILE = path.join(DATA_DIR, 'repos.json.enc');
export const MAPPINGS_FILE = path.join(DATA_DIR, 'repo-mappings.json');

// Encryption constants
export const ENCRYPTION_KEY_DEFAULT = 'default-key-change-in-production-32!';
export const IV_LENGTH = 16;
export const ALGORITHM = 'aes-256-cbc';

// OpenRouter API constants
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_DEFAULT_TITLE = 'AI Code Reviewer';
export const OPENROUTER_MAX_TOKENS = 4000;
export const OPENROUTER_TEMPERATURE = 0.3;

// Vulnerability patterns for security scanning
export const VULNERABILITY_PATTERNS = [
  { pattern: /password\s*=/i, severity: 'high' as const, type: 'Hardcoded credentials' },
  { pattern: /api[_-]?key\s*=/i, severity: 'high' as const, type: 'Hardcoded API key' },
  { pattern: /secret\s*=/i, severity: 'high' as const, type: 'Hardcoded secret' },
  { pattern: /eval\s*\(/i, severity: 'high' as const, type: 'Code injection risk (eval)' },
  { pattern: /exec\s*\(/i, severity: 'high' as const, type: 'Command injection risk' },
  { pattern: /innerHTML/i, severity: 'medium' as const, type: 'XSS vulnerability' },
  { pattern: /dangerouslySetInnerHTML/i, severity: 'medium' as const, type: 'XSS vulnerability' },
  { pattern: /sql\s*injection/i, severity: 'high' as const, type: 'SQL injection' },
  { pattern: /SELECT.*FROM.*WHERE.*\+/i, severity: 'medium' as const, type: 'SQL injection risk' },
  { pattern: /\.env/i, severity: 'medium' as const, type: 'Environment file access' },
  { pattern: /process\.env/i, severity: 'low' as const, type: 'Environment variable usage' },
  { pattern: /crypto\.createHash\('md5'/i, severity: 'medium' as const, type: 'Weak hashing algorithm (MD5)' },
  { pattern: /Math\.random\(\)/i, severity: 'medium' as const, type: 'Weak random number generator' },
  { pattern: /http:\/\//i, severity: 'medium' as const, type: 'Insecure HTTP protocol' },
  { pattern: /console\.log/i, severity: 'low' as const, type: 'Debug code left in production' },
  { pattern: /TODO/i, severity: 'low' as const, type: 'TODO comment found' },
  { pattern: /FIXME/i, severity: 'low' as const, type: 'FIXME comment found' },
  { pattern: /async\s+function\s+\w+\s*\([^)]*\)\s*{[^}]*await\s+[^}]+}/i, severity: 'low' as const, type: 'Async function structure' },
  { pattern: /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/i, severity: 'low' as const, type: 'Try-catch structure' }
];
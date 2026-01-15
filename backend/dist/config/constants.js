"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VULNERABILITY_PATTERNS = exports.OPENROUTER_TEMPERATURE = exports.OPENROUTER_MAX_TOKENS = exports.OPENROUTER_DEFAULT_TITLE = exports.OPENROUTER_BASE_URL = exports.ALGORITHM = exports.IV_LENGTH = exports.ENCRYPTION_KEY_DEFAULT = exports.MAPPINGS_FILE = exports.REPOS_FILE = exports.DATA_DIR = exports.APP_NAME = exports.DEFAULT_PORT = void 0;
const path_1 = __importDefault(require("path"));
// Application constants
exports.DEFAULT_PORT = 3001;
exports.APP_NAME = 'AI Code Reviewer';
// Directory and file paths
exports.DATA_DIR = path_1.default.join(process.cwd(), 'data');
exports.REPOS_FILE = path_1.default.join(exports.DATA_DIR, 'repos.json.enc');
exports.MAPPINGS_FILE = path_1.default.join(exports.DATA_DIR, 'repo-mappings.json');
// Encryption constants
exports.ENCRYPTION_KEY_DEFAULT = 'default-key-change-in-production-32!';
exports.IV_LENGTH = 16;
exports.ALGORITHM = 'aes-256-cbc';
// OpenRouter API constants
exports.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
exports.OPENROUTER_DEFAULT_TITLE = 'AI Code Reviewer';
exports.OPENROUTER_MAX_TOKENS = 4000;
exports.OPENROUTER_TEMPERATURE = 0.3;
// Vulnerability patterns for security scanning
exports.VULNERABILITY_PATTERNS = [
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

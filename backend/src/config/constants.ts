import * as path from 'path';

export const REPOS_DIR = path.join(__dirname, '../../../temp/repos');
export const DATA_DIR = path.join(__dirname, '../../../data');
export const REPOS_FILE = path.join(DATA_DIR, 'repos.json.enc');
export const MAPPINGS_FILE = path.join(DATA_DIR, 'repo-mappings.json');

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32!';
export const IV_LENGTH = 16;
export const ALGORITHM = 'aes-256-cbc';

export const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const SITE_URL = process.env.SITE_URL || 'http://localhost:3001';
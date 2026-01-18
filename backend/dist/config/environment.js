"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
function validateEnvironment() {
    const required = ['OPENROUTER_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    // Optional but recommended
    if (!process.env.ENCRYPTION_KEY) {
        console.warn('ENCRYPTION_KEY not set, using default (not recommended for production)');
    }
    if (!process.env.GITHUB_ACCESS_TOKEN) {
        console.warn('GITHUB_ACCESS_TOKEN not set, private repositories may not be accessible');
    }
}

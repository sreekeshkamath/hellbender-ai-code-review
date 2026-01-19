export function validateEnvironment() {
  const required = ['OPENROUTER_API_KEY'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate OPENROUTER_API_KEY
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required and must not be empty');
  }

  // Handle ENCRYPTION_KEY based on environment
  if (!process.env.ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production and must not be empty');
    } else {
      // Generate a secure random key for non-production
      const crypto = require('crypto');
      const generatedKey = crypto.randomBytes(32).toString('hex');
      process.env.ENCRYPTION_KEY = generatedKey;
      console.warn('═══════════════════════════════════════════════════════');
      console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in environment');
      console.warn('⚠️  Generated ephemeral encryption key for this session');
      console.warn('⚠️  This key will be lost when the process restarts');
      console.warn('⚠️  Set ENCRYPTION_KEY in your .env file for persistence');
      console.warn('═══════════════════════════════════════════════════════');
    }
  }

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    console.warn('GITHUB_ACCESS_TOKEN not set, private repositories may not be accessible');
  }
}
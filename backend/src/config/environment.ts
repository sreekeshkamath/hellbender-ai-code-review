// Environment variable validation and defaults
export const env = {
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  PORT: parseInt(process.env.PORT || '3001'),
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  SITE_URL: process.env.SITE_URL || 'http://localhost:3001',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32!'
};

// Validate required environment variables
if (!env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY is required');
  process.exit(1);
}

if (env.ENCRYPTION_KEY.length < 32) {
  console.warn('ENCRYPTION_KEY should be at least 32 characters for security');
}